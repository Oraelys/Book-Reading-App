import {
  BadRequestException,
  Injectable,
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
     * If the administrator says the credited
     * author has an Inkwell account, verify that
     * account exists before creating the book.
     */
    if (authorId) {
      const {
        data: author,
        error: authorError,
      } = await this.database
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
     * Create the novel without assigning
     * the administrator as its owner.
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
      /*
       * Record the import relationship.
       */
      const {
        error: importError,
      } = await this.database
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

      /*
       * The pipeline receives only the novel ID.
       *
       * It does NOT receive importedBy as
       * the novel owner.
       */
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
      /*
       * The novel is only an imported shell until
       * its manuscript has successfully entered
       * the processing pipeline.
       *
       * Delete it on failure. The FK cascade
       * removes chapters/import metadata belonging
       * to it.
       */
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
   * ADMIN / AUTHOR
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