
import {
  BadRequestException,
  Injectable,
  Logger,
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

import {
  MediaService,
} from '../media/media.service';

@Injectable()
export class ContentService {

  private readonly logger =
    new Logger(ContentService.name);

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

    private readonly media:
      MediaService,
  ) {}

  /*
   * ============================
   * ADMIN BOOK IMPORT
   * ============================
   */

  async importBook(
    file: any,
    cover: any,
    data: {
      title: string;
      authorName: string;
      authorId?: string;
      description?: string;
      category?: string;
    },
    importedBy: string,
  ) {
    this.logger.log(
      '========== ADMIN BOOK IMPORT STARTED ==========',
    );

    this.logger.log(
      `Import request received. File: ${
        file?.originalname ?? 'unknown'
      }, Size: ${
        file?.size ?? 'unknown'
      } bytes`,
    );

    /*
     * ============================
     * BASIC VALIDATION
     * ============================
     */

    if (!file?.buffer) {
      this.logger.warn(
        'Import rejected: uploaded file has no buffer.',
      );

      throw new BadRequestException(
        'Uploaded file is empty.',
      );
    }

    if (!cover?.buffer) {
      this.logger.warn(
        'Import rejected: cover image has no buffer.',
      );

      throw new BadRequestException(
        'Cover image is required.',
      );
    }

    if (!importedBy?.trim()) {
      this.logger.warn(
        'Import rejected: administrator identity is missing.',
      );

      throw new BadRequestException(
        'Administrator identity is required.',
      );
    }

    const title =
      data?.title?.trim();

    if (!title) {
      this.logger.warn(
        'Import rejected: book title is missing.',
      );

      throw new BadRequestException(
        'Book title is required.',
      );
    }

    const authorName =
      data?.authorName?.trim();

    if (!authorName) {
      this.logger.warn(
        'Import rejected: author name is missing.',
      );

      throw new BadRequestException(
        'Author name is required.',
      );
    }

    /*
     * ============================
     * CREDITED AUTHOR
     * ============================
     */

    const authorId =
      data?.authorId?.trim() ||
      null;

    /*
     * If the credited author has
     * an Inkwell account, verify it.
     */

    if (authorId) {
      this.logger.log(
        'Stage 1: validating credited Inkwell author.',
      );

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
        this.logger.error(
          `Credited author validation failed: ${
            authorError?.message ??
            'profile not found'
          }`,
        );

        throw new BadRequestException(
          'The credited Inkwell author could not be found.',
        );
      }

      this.logger.log(
        'Stage 1 complete: credited author verified.',
      );
    } else {
      this.logger.log(
        'Stage 1: no Inkwell author ID supplied; treating author as external.',
      );
    }

    /*
     * ============================
     * MANUSCRIPT FILE VALIDATION
     * ============================
     */

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
      this.logger.warn(
        `Import rejected: unsupported file extension ${extension}.`,
      );

      throw new BadRequestException(
        'Unsupported manuscript format. Supported formats are TXT, DOCX, and EPUB.',
      );
    }

    this.logger.log(
      `File validation complete. Format: ${extension}`,
    );

    /*
     * ============================
     * COVER VALIDATION
     * ============================
     */

    const coverExtension =
      extname(
        cover.originalname ||
        '',
      ).toLowerCase();

    const supportedCoverExtensions =
      new Set([
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
      ]);

    if (
      !supportedCoverExtensions.has(
        coverExtension,
      )
    ) {
      this.logger.warn(
        `Import rejected: unsupported cover extension ${coverExtension}.`,
      );

      throw new BadRequestException(
        'Unsupported cover image format. Supported formats are JPG, JPEG, PNG, and WEBP.',
      );
    }

    this.logger.log(
      `Cover validation complete. Format: ${coverExtension}`,
    );

    /*
     * ============================
     * IMPORT STATE
     * ============================
     */

    let novelId:
      string | null = null;

    let temporaryDirectory:
      string | null = null;

    let uploadedCoverId:
      string | null = null;

    try {
      /*
       * ============================
       * STAGE 2
       * CREATE NOVEL
       * ============================
       */

      this.logger.log(
        'Stage 2: creating imported novel record.',
      );

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

      novelId =
        novel.id;

      this.logger.log(
        `Stage 2 complete: imported novel created. Novel ID: ${novel.id}`,
      );

      /*
       * ============================
       * STAGE 2.1
       * UPLOAD COVER
       * ============================
       */

      this.logger.log(
        'Stage 2.1: uploading book cover.',
      );

      const uploadedCover =
        await this.media.uploadImage(
          importedBy,
          `novels/${novel.id}/cover`,
          cover,
        );

      uploadedCoverId =
        uploadedCover.id;

      this.logger.log(
        `Stage 2.1 complete: cover uploaded. Media ID: ${uploadedCover.id}`,
      );

      /*
       * ============================
       * STAGE 2.2
       * SAVE COVER URL
       * ============================
       */

      this.logger.log(
        'Stage 2.2: saving cover URL to novel.',
      );

      const {
        error: coverUpdateError,
      } =
        await this.database
          .getClient()
          .from('novels')
          .update({
            cover_image_url:
              uploadedCover.public_url,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            novel.id,
          );

      if (coverUpdateError) {
        this.logger.error(
          [
            'Stage 2.2 FAILED: unable to save cover URL.',
            `Message: ${coverUpdateError.message}`,
            `Code: ${
              coverUpdateError.code ??
              'unknown'
            }`,
            `Details: ${
              coverUpdateError.details ??
              'none'
            }`,
            `Hint: ${
              coverUpdateError.hint ??
              'none'
            }`,
          ].join('\n'),
        );

        throw coverUpdateError;
      }

      this.logger.log(
        'Stage 2.2 complete: cover URL saved to novel.',
      );

      /*
       * ============================
       * STAGE 3
       * TEMPORARY FILE
       * ============================
       */

      temporaryDirectory =
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

      this.logger.log(
        `Stage 3: temporary import directory created: ${temporaryDirectory}`,
      );

      /*
       * ============================
       * STAGE 4
       * IMPORT RECORD
       * ============================
       */

      this.logger.log(
        'Stage 4: creating novel_imports record.',
      );

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
        this.logger.error(
          [
            'Stage 4 FAILED: novel_imports insert failed.',
            `Message: ${importError.message}`,
            `Code: ${
              importError.code ??
              'unknown'
            }`,
            `Details: ${
              importError.details ??
              'none'
            }`,
            `Hint: ${
              importError.hint ??
              'none'
            }`,
          ].join('\n'),
        );

        throw importError;
      }

      this.logger.log(
        'Stage 4 complete: novel_imports record created.',
      );

      /*
       * ============================
       * STAGE 5
       * WRITE MANUSCRIPT
       * ============================
       */

      this.logger.log(
        `Stage 5: writing uploaded file to temporary path: ${temporaryFile}`,
      );

      await fs.writeFile(
        temporaryFile,
        file.buffer,
      );

      this.logger.log(
        'Stage 5 complete: uploaded file written successfully.',
      );

      /*
       * ============================
       * STAGE 6
       * PROCESS CONTENT
       * ============================
       */

      this.logger.log(
        'Stage 6: starting content processing pipeline.',
      );

      const result =
        await this.pipeline.process(
          temporaryFile,
          novel.id,
        );

      this.logger.log(
        'Stage 6 complete: content processing pipeline finished successfully.',
      );

      this.logger.log(
        '========== ADMIN BOOK IMPORT COMPLETED ==========',
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

        coverImageUrl:
          uploadedCover.public_url,

        coverMediaId:
          uploadedCover.id,
      };
    } catch (error) {
      /*
       * ============================
       * IMPORT FAILURE
       * ============================
       */

      this.logger.error(
        '========== ADMIN BOOK IMPORT FAILED ==========',
      );

      if (error instanceof Error) {
        this.logger.error(
          `Error: ${error.message}`,
        );

        if (error.stack) {
          this.logger.error(
            `Stack:\n${error.stack}`,
          );
        }
      } else {
        this.logger.error(
          [
            'Unknown import error object:',
            JSON.stringify(
              error,
              null,
              2,
            ),
          ].join('\n'),
        );
      }

      /*
       * ============================
       * COVER CLEANUP
       * ============================
       *
       * Media records are not owned by
       * the novel through a database FK,
       * so explicitly remove the uploaded
       * cover before deleting the novel.
       */

      if (uploadedCoverId) {
        this.logger.warn(
          `Cleaning up uploaded cover media: ${uploadedCoverId}`,
        );

        try {
          await this.media.deleteMedia(
            uploadedCoverId,
          );

          this.logger.log(
            `Cover cleanup complete: ${uploadedCoverId}`,
          );
        } catch (coverCleanupError) {
          if (
            coverCleanupError instanceof Error
          ) {
            this.logger.error(
              [
                'Cover cleanup failed.',
                `Media ID: ${uploadedCoverId}`,
                `Error: ${coverCleanupError.message}`,
                coverCleanupError.stack
                  ? `Stack:\n${coverCleanupError.stack}`
                  : '',
              ].join('\n'),
            );
          } else {
            this.logger.error(
              `Cover cleanup failed: ${String(
                coverCleanupError,
              )}`,
            );
          }
        }
      }

      /*
       * ============================
       * NOVEL ROLLBACK
       * ============================
       */

      if (novelId) {
        this.logger.warn(
          `Rolling back imported novel: ${novelId}`,
        );

        try {
          await this.novels.delete(
            novelId,
          );

          this.logger.log(
            `Rollback complete for novel: ${novelId}`,
          );
        } catch (rollbackError) {
          if (
            rollbackError instanceof Error
          ) {
            this.logger.error(
              [
                'Novel rollback failed.',
                `Novel ID: ${novelId}`,
                `Error: ${rollbackError.message}`,
                rollbackError.stack
                  ? `Stack:\n${rollbackError.stack}`
                  : '',
              ].join('\n'),
            );
          } else {
            this.logger.error(
              `Novel rollback failed: ${String(
                rollbackError,
              )}`,
            );
          }
        }
      }

      throw error;
    } finally {
      /*
       * ============================
       * TEMPORARY DIRECTORY CLEANUP
       * ============================
       */

      if (temporaryDirectory) {
        this.logger.log(
          `Cleaning temporary import directory: ${temporaryDirectory}`,
        );

        try {
          await fs.rm(
            temporaryDirectory,
            {
              recursive: true,
              force: true,
            },
          );

          this.logger.log(
            'Temporary import directory cleaned successfully.',
          );
        } catch (cleanupError) {
          if (
            cleanupError instanceof Error
          ) {
            this.logger.error(
              [
                'Temporary directory cleanup failed.',
                `Error: ${cleanupError.message}`,
                cleanupError.stack
                  ? `Stack:\n${cleanupError.stack}`
                  : '',
              ].join('\n'),
            );
          } else {
            this.logger.error(
              `Temporary directory cleanup failed: ${String(
                cleanupError,
              )}`,
            );
          }
        }
      }
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

