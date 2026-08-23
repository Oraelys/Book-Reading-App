import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../modules/database/supabase.service';

@Injectable()
export class ProcessingService {
  constructor(
    private readonly supabaseService:
      SupabaseService,
  ) {}

  /**
   * Create a processing job for a book.
   */
  async createBookProcessingJob(
    bookId: string,
  ) {
    const supabase =
      this.supabaseService.getClient();

    const {
      data: book,
      error: bookError,
    } = await supabase
      .from('novels')
      .select('id, title')
      .eq('id', bookId)
      .maybeSingle();

    if (bookError) {
      throw bookError;
    }

    if (!book) {
      throw new NotFoundException(
        'Book not found',
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('processing_jobs')
      .insert({
        book_id: bookId,
        job_type: 'PROCESS_BOOK',
        status: 'pending',
        progress: 0,
        error_message: null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await this.createAdminEvent(
      'BOOK_PROCESSING_STARTED',
      book.title,
      'Book processing job created.',
    );

    return data;
  }

  /**
   * Mark a job as actively processing.
   */
  async startJob(
    jobId: string,
  ) {
    return this.updateJob(
      jobId,
      {
        status: 'processing',
        progress: 1,
        started_at:
          new Date().toISOString(),
        error_message: null,
      },
    );
  }

  /**
   * Update processing percentage.
   */
  async updateProgress(
    jobId: string,
    progress: number,
  ) {
    const value =
      Math.max(
        0,
        Math.min(
          99,
          Math.round(progress),
        ),
      );

    return this.updateJob(
      jobId,
      {
        status: 'processing',
        progress: value,
      },
    );
  }

  /**
   * Mark processing as successful.
   */
  async completeJob(
    jobId: string,
  ) {
    const job =
      await this.getJob(
        jobId,
      );

    if (!job) {
      throw new NotFoundException(
        'Processing job not found',
      );
    }

    const result =
      await this.updateJob(
        jobId,
        {
          status: 'completed',
          progress: 100,
          error_message: null,
        },
      );

    await this.createAdminEvent(
      'BOOK_PROCESSING_COMPLETED',
      job.book_id,
      'Book processing completed successfully.',
    );

    return result;
  }

  /**
   * Mark processing as failed.
   */
  async failJob(
    jobId: string,
    error: unknown,
  ) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const result =
      await this.updateJob(
        jobId,
        {
          status: 'failed',
          error_message: message,
        },
      );

    await this.createAdminEvent(
      'BOOK_PROCESSING_FAILED',
      jobId,
      message,
    );

    return result;
  }

  /**
   * Retry a failed job.
   */
  async retryJob(
    jobId: string,
  ) {
    const job =
      await this.getJob(
        jobId,
      );

    if (!job) {
      throw new NotFoundException(
        'Processing job not found',
      );
    }

    if (
      job.status !== 'failed'
    ) {
      return job;
    }

    return this.updateJob(
      jobId,
      {
        status: 'pending',
        progress: 0,
        error_message: null,
        started_at: null,
      },
    );
  }

  /**
   * Get all processing jobs.
   */
  async getJobs() {
    const {
      data,
      error,
    } = await this.supabaseService
      .getClient()
      .from('processing_jobs')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get one processing job.
   */
  async getJob(
    id: string,
  ) {
    const {
      data,
      error,
    } = await this.supabaseService
      .getClient()
      .from('processing_jobs')
      .select('*')
      .eq(
        'id',
        id,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  private async updateJob(
    jobId: string,
    values: Record<
      string,
      unknown
    >,
  ) {
    const {
      data,
      error,
    } = await this.supabaseService
      .getClient()
      .from('processing_jobs')
      .update({
        ...values,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        jobId,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  private async createAdminEvent(
    type: string,
    title: string,
    description: string,
  ) {
    await this.supabaseService
      .getClient()
      .from('admin_events')
      .insert({
        type,
        severity: 'info',
        title,
        description,
      });
  }
}