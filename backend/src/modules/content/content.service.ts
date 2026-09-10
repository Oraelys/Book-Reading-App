
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
  ) {}

  /*
   * ============================
   * ADMIN BOOK IMPORT
   * ============================
   */

  async importBook(
    file: any,
    novelId: string,
    importedBy: string,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException(
        'Uploaded file is empty.',
      );
    }

    if (!novelId?.trim()) {
      throw new BadRequestException(
        'novelId is required.',
      );
    }

    if (!importedBy?.trim()) {
      throw new BadRequestException(
        'Administrator identity is required.',
      );
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
      await fs.writeFile(
        temporaryFile,
        file.buffer,
      );

      /*
       * The administrator ID is deliberately
       * not passed to the pipeline as the
       * novel owner/author.
       *
       * It represents only the administrator
       * performing the import.
       */

      const result =
        await this.pipeline.process(
          temporaryFile,
          novelId,
        );

      return {
        ...result,
        importedBy,
        originalFileName:
          basename(originalName),
        fileType:
          extension.substring(1),
      };
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
    return this.processing.getJob(
      jobId,
    );
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

