import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ContentProcessingService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async createJob(
    novelId: string,
    jobType = 'BOOK_IMPORT',
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error: novelError,
    } = await supabase
      .from('novels')
      .select('id')
      .eq('id', novelId)
      .maybeSingle();

    if (novelError) {
      throw novelError;
    }

    if (!novel) {
      throw new NotFoundException(
        'Novel not found.',
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('processing_jobs')
      .insert({
        book_id: novelId,
        job_type: jobType,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async start(
    jobId: string,
  ) {
    return this.update(
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

  async progress(
    jobId: string,
    percentage: number,
  ) {
    const progress =
      Math.max(
        0,
        Math.min(
          99,
          Math.round(
            percentage,
          ),
        ),
      );

    return this.update(
      jobId,
      {
        status: 'processing',
        progress,
      },
    );
  }

  async complete(
    jobId: string,
  ) {
    return this.update(
      jobId,
      {
        status: 'completed',
        progress: 100,
        error_message: null,
      },
    );
  }

  async fail(
    jobId: string,
    error: unknown,
  ) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return this.update(
      jobId,
      {
        status: 'failed',
        error_message: message,
      },
    );
  }

  async getJob(
    jobId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('processing_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  private async update(
    jobId: string,
    values: Record<string, unknown>,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('processing_jobs')
      .update({
        ...values,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}