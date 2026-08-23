import {
  Injectable,
} from '@nestjs/common';

import {
  FileDetectorService,
} from './file-detector.service';

import {
  ParserFactoryService,
} from './parsers/parser-factory.service';

import {
  ContentCleanerService,
} from './processing/content-cleaner.service';

import {
  ChapterSplitterService,
} from './processing/chapter-splitter.service';

import {
  ContentStorageService,
} from './content-storage.service';

import {
  ProcessingService,
} from '../../../processing/processing.service';

@Injectable()
export class ContentPipelineService {
  constructor(
    private readonly detector:
      FileDetectorService,

    private readonly factory:
      ParserFactoryService,

    private readonly cleaner:
      ContentCleanerService,

    private readonly splitter:
      ChapterSplitterService,

    private readonly storage:
      ContentStorageService,

    private readonly processing:
      ProcessingService,
  ) {}

  async process(
    file: string,
    novelId: string,
    jobId?: string,
  ) {
    /*
     * Resolve the processing job before
     * entering the try block.
     *
     * This guarantees that TypeScript knows
     * job is always a string.
     */
    const job: string =
      jobId ??
      (
        await this.processing
          .createBookProcessingJob(
            novelId,
          )
      ).id;

    try {
      await this.processing.startJob(
        job,
      );

      await this.processing.updateProgress(
        job,
        10,
      );

      /*
       * Detect file format.
       */
      const extension =
        this.detector.detect(
          file,
        );

      await this.processing.updateProgress(
        job,
        20,
      );

      /*
       * Select parser.
       */
      const parser =
        this.factory.getParser(
          extension,
        );

      await this.processing.updateProgress(
        job,
        30,
      );

      /*
       * Extract document.
       */
      const document =
        await parser.parse(
          file,
        );

      await this.processing.updateProgress(
        job,
        45,
      );

      /*
       * Clean extracted content.
       */
      const cleaned =
        this.cleaner.clean(
          document,
        );

      await this.processing.updateProgress(
        job,
        60,
      );

      /*
       * Detect and split chapters.
       */
      const structured =
        this.splitter.split(
          cleaned,
        );

      await this.processing.updateProgress(
        job,
        75,
      );

      /*
       * Store processed chapters.
       */
      const chapters =
        await this.storage.saveDocument(
          novelId,
          structured,
        );

      await this.processing.updateProgress(
        job,
        95,
      );

      /*
       * Processing completed.
       */
      await this.processing.completeJob(
        job,
      );

      return {
        success: true,

        jobId: job,

        novelId,

        format:
          extension,

        title:
          structured.title,

        author:
          structured.author,

        chapterCount:
          chapters.length,

        chapters,
      };
    } catch (error) {
      /*
       * Processing failed.
       */
      await this.processing.failJob(
        job,
        error,
      );

      throw error;
    }
  }
}

