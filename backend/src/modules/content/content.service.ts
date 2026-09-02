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
   *
   * Publishing is delegated to
   * WritingModule, which is now the
   * canonical owner of chapter
   * publication state.
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