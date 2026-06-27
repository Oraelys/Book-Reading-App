import { Controller, Post, Get, Param } from '@nestjs/common';
import { ProcessingService } from './processing.service';

@Controller('processing')
export class ProcessingController {
  constructor(
    private readonly processingService: ProcessingService,
  ) {}

  @Post('book/:bookId')
  async processBook(
    @Param('bookId') bookId: string,
  ) {
    return this.processingService.createBookProcessingJob(
      bookId,
    );
  }

  @Get('jobs')
  async getJobs() {
    return this.processingService.getJobs();
  }

  @Get('jobs/:id')
  async getJob(
    @Param('id') id: string,
  ) {
    return this.processingService.getJob(id);
  }
}