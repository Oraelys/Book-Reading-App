import {
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import {
  ProcessingService,
} from './processing.service';

@Controller('processing')
export class ProcessingController {
  constructor(
    private readonly processingService:
      ProcessingService,
  ) {}

  /**
   * Create a new book processing job.
   */
  @Post('book/:bookId')
  async processBook(
    @Param('bookId')
    bookId: string,
  ) {
    return this.processingService
      .createBookProcessingJob(
        bookId,
      );
  }

  /**
   * Retry a failed processing job.
   */
  @Post('jobs/:id/retry')
  async retryJob(
    @Param('id')
    id: string,
  ) {
    return this.processingService
      .retryJob(id);
  }

  /**
   * Get all processing jobs.
   */
  @Get('jobs')
  async getJobs() {
    return this.processingService
      .getJobs();
  }

  /**
   * Get a single processing job.
   */
  @Get('jobs/:id')
  async getJob(
    @Param('id')
    id: string,
  ) {
    return this.processingService
      .getJob(id);
  }
}