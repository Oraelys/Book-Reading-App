import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomUUID,
} from 'crypto';

import {
  promises as fs,
} from 'fs';

import {
  basename,
  extname,
  join,
} from 'path';

import {
  tmpdir,
} from 'os';

import {
  ContentPipelineService,
} from './providers/content-pipeline.service';

import {
  ContentStorageService,
} from './providers/content-storage.service';

import {
  ProcessingService,
} from '../../processing/processing.service';

import {
  ChapterPublishService,
} from '../writing/providers/chapter-publish.service';

import {
  PublishingService,
} from '../publishing/publishing.service';

import {
  NovelsService,
} from '../novels/novels.service';

import {
  SupabaseService,
} from '../database/supabase.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly pipeline:
      ContentPipelineService,

    private readonly storage:
      ContentStorageService,

    private readonly processing:
      ProcessingService,

    private readonly chapterPublishService:
      ChapterPublishService,

    private readonly publishingService:
      PublishingService,

    private readonly novels:
      NovelsService,

    private readonly database:
      SupabaseService,
  ) {}

  /*
   * ============================
   * ADMIN BOOK IMPORT
   * ============================
   */

  async importBook(
    file: any,
    data: {
      title: string;
      authorName: string;
      authorId?: string;
      description?: string;
      category?: string;
    },
    importedBy: string,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException(
        'Uploaded file is empty.',
      );
    }

    if (!importedBy?.trim()) {
      throw new BadRequestException(
        'Administrator identity is required.',
      );
    }

    const title =
      data?.title?.trim();

    if (!title) {
      throw new BadRequestException(
        'Book title is required.',
      );
    }

    const authorName =
      data?.authorName?.trim();

    if (!authorName) {
      throw new BadRequestException(
        'Author name is required.',
      );
    }

    const authorId =
      data?.authorId?.trim() ||
      null;

    /*
     * If the credited author has
     * an Inkwell account, verify it.
     */
    if (authorId) {
      const {
        data: author,
        error: authorError,
      } =
        await this.database
          .getClient()
          .from('profiles')
          .select('id')
          .eq('id', authorId)
          .maybeSingle();

      if (
        authorError ||
        !author
      ) {
        throw new BadRequestException(
          'The credited Inkwell author could not be found.',
        );
      }
    }

    const originalName =
      file.originalname ||
      'manuscript';

    const extension =
      extname(originalName)
        .toLowerCase();

    const supportedExtensions =
      new Set([
        '.txt',
        '.docx',
        '.epub',
      ]);

    if (
      !supportedExtensions.has(
        extension,
      )
    ) {
      throw new BadRequestException(
        'Unsupported manuscript format. Supported formats are TXT, DOCX, and EPUB.',
      );
    }

    /*
     * Imported novels do not belong
     * to the administrator.
     */
    const novel =
      await this.novels
        .createImportedNovel({
          title,

          description:
            data.description?.trim() ||
            null,

          category:
            data.category?.trim() ||
            null,

          authorName,
        });

    const temporaryDirectory =
      await fs.mkdtemp(
        join(
          tmpdir(),
          'inkwell-admin-import-',
        ),
      );

    const temporaryFile =
      join(
        temporaryDirectory,
        `${randomUUID()}${extension}`,
      );

    try {
      const {
        error: importError,
      } =
        await this.database
          .getClient()
          .from('novel_imports')
          .insert({
            novel_id:
              novel.id,

            imported_by:
              importedBy,

            credited_author_id:
              authorId,

            credited_author_name:
              authorName,

            original_file_name:
              basename(originalName),

            file_type:
              extension.substring(1),
          });

      if (importError) {
        throw importError;
      }

      await fs.writeFile(
        temporaryFile,
        file.buffer,
      );

      const result =
        await this.pipeline.process(
          temporaryFile,
          novel.id,
        );

      return {
        ...result,

        novelId:
          novel.id,

        importedBy,

        originalFileName:
          basename(originalName),

        fileType:
          extension.substring(1),

        creditedAuthor:
          authorName,

        creditedAuthorId:
          authorId,
      };
    } catch (error) {
      await this.novels
        .delete(novel.id);

      throw error;
    } finally {
      await fs.rm(
        temporaryDirectory,
        {
          recursive: true,
          force: true,
        },
      );
    }
  }

  /*
   * ============================
   * ADMIN IMPORT MANAGEMENT
   * ============================
   */

  async getImportedNovels() {
    const {
      data,
      error,
    } =
      await this.database
        .getClient()
        .from('novels')
        .select(
          `
          id,
          title,
          author_name,
          description,
          category,
          status,
          is_public,
          content_origin,
          total_chapters,
          published_chapters,
          total_words,
          created_at,
          updated_at,
          published_at
          `,
        )
        .eq(
          'content_origin',
          'admin_imported',
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getImportedNovel(
    novelId: string,
  ) {
    const {
      data,
      error,
    } =
      await this.database
        .getClient()
        .from('novels')
        .select(
          `
          id,
          title,
          author_name,
          description,
          category,
          status,
          is_public,
          content_origin,
          total_chapters,
          published_chapters,
          total_words,
          created_at,
          updated_at,
          published_at
          `,
        )
        .eq(
          'id',
          novelId,
        )
        .eq(
          'content_origin',
          'admin_imported',
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Imported novel not found.',
      );
    }

    return data;
  }

  async getImportedChapters(
    novelId: string,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    const {
      data,
      error,
    } =
      await this.database
        .getClient()
        .from('chapters')
        .select(
          `
          id,
          novel_id,
          title,
          slug,
          chapter_number,
          content,
          word_count,
          estimated_read_time,
          is_published,
          published_at,
          unpublished_at,
          status,
          views,
          likes,
          comments,
          created_at,
          updated_at,
          last_saved_at
          `,
        )
        .eq(
          'novel_id',
          novelId,
        )
        .order(
          'chapter_number',
          {
            ascending: true,
          },
        );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getImportedChapter(
    novelId: string,
    chapterNumber: number,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    const {
      data,
      error,
    } =
      await this.database
        .getClient()
        .from('chapters')
        .select('*')
        .eq(
          'novel_id',
          novelId,
        )
        .eq(
          'chapter_number',
          chapterNumber,
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Imported chapter not found.',
      );
    }

    return data;
  }

  async publishImportedChapter(
    novelId: string,
    chapterId: string,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    return this.chapterPublishService
      .publish(
        chapterId,
        novelId,
      );
  }

  async unpublishImportedChapter(
    novelId: string,
    chapterId: string,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    return this.chapterPublishService
      .unpublish(
        chapterId,
        novelId,
      );
  }

  async publishImportedNovel(
    novelId: string,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    return this.publishingService
      .publishStory(
        novelId,
      );
  }

  async unpublishImportedNovel(
    novelId: string,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    return this.publishingService
      .unpublishStory(
        novelId,
      );
  }

  async validateImportedNovel(
    novelId: string,
  ) {
    await this.getImportedNovel(
      novelId,
    );

    return this.publishingService
      .validateStory(
        novelId,
      );
  }

  /*
   * ============================
   * PROCESSING JOBS
   * ============================
   */

  async getProcessingJob(
    jobId: string,
  ) {
    return this.processing
      .getJob(jobId);
  }

  /*
   * ============================
   * READER
   * ============================
   */

  async getPublishedChapters(
    novelId: string,
  ) {
    return this.storage
      .getPublishedChapters(
        novelId,
      );
  }

  async getPublishedChapter(
    novelId: string,
    chapterNumber: number,
  ) {
    return this.storage
      .getPublishedChapter(
        novelId,
        chapterNumber,
      );
  }

  /*
   * ============================
   * AUTHOR
   * ============================
   */

  async getAllChapters(
    novelId: string,
  ) {
    return this.storage
      .getAllChapters(
        novelId,
      );
  }

  async getChapter(
    novelId: string,
    chapterNumber: number,
  ) {
    return this.storage
      .getChapter(
        novelId,
        chapterNumber,
      );
  }

  /*
   * ============================
   * PUBLISHING
   * ============================
   */

  async publishChapter(
    chapterId: string,
  ) {
    return this.chapterPublishService
      .publish(
        chapterId,
      );
  }

  async unpublishChapter(
    chapterId: string,
  ) {
    return this.chapterPublishService
      .unpublish(
        chapterId,
      );
  }

  async publishAll(
    novelId: string,
  ) {
    return this.chapterPublishService
      .publishAll(
        novelId,
      );
  }

  async unpublishAll(
    novelId: string,
  ) {
    return this.chapterPublishService
      .unpublishAll(
        novelId,
      );
  }

  async getPublishingStatus(
    novelId: string,
  ) {
    return this.chapterPublishService
      .getPublishingStatus(
        novelId,
      );
  }
}