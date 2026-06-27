import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class ProcessingService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async createBookProcessingJob(bookId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: book } = await supabase
      .from('novels')
      .select('*')
      .eq('id', bookId)
      .single();

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const { data, error } = await supabase
      .from('processing_jobs')
      .insert({
        book_id: bookId,
        job_type: 'PROCESS_BOOK',
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('admin_events')
      .insert({
        type: 'BOOK_PROCESSING_STARTED',
        severity: 'info',
        title: 'Book Processing Started',
        description: `${book.title} queued for processing`,
      });

    return data;
  }

  async getJobs() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async getJob(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}