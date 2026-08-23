import {
  Injectable,
} from '@nestjs/common';

import {
  ContentPipelineService,
} from './providers/content-pipeline.service';

import {
  ContentStorageService,
} from './providers/content-storage.service';

import {
  ChapterPublishingService,
} from './providers/chapter-publishing.service';

import {
  ProcessingService,
} from '../../processing/processing.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly pipeline:
      ContentPipelineService,

    private readonly storage:
      ContentStorageService,

    private readonly processing:
      ProcessingService,

    private readonly publishing:
      ChapterPublishingService,
  ) {}

  async upload(
    file: string,
    novelId: string,
  ) {
    return this.pipeline.process(
      file,
      novelId,
    );
  }

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
    return this.publishing
      .publishChapter(
        chapterId,
      );
  }

  async unpublishChapter(
    chapterId: string,
  ) {
    return this.publishing
      .unpublishChapter(
        chapterId,
      );
  }

  async publishAll(
    novelId: string,
  ) {
    return this.publishing
      .publishAll(
        novelId,
      );
  }

  async unpublishAll(
    novelId: string,
  ) {
    return this.publishing
      .unpublishAll(
        novelId,
      );
  }

  async getPublishingStatus(
    novelId: string,
  ) {
    return this.publishing
      .getPublishingStatus(
        novelId,
      );
  }
}