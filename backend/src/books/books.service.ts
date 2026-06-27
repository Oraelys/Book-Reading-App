import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class BooksService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}