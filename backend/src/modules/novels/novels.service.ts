import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class NovelsService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async create(data: any) {
    const { data: novel, error } =
      await this.database
        .getClient()
        .from('novels')
        .insert(data)
        .select()
        .single();

    if (error) throw error;

    return novel;
  }

  async findAll() {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .order('updated_at', {
          ascending: false,
        });

    if (error) throw error;

    return data;
  }

  async findOne(id: string) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('id', id)
        .single();

    if (error)
      throw new NotFoundException();

    return data;
  }

  async update(
    id: string,
    dto: any,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .update({
          ...dto,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return data;
  }

  async delete(id: string) {
    await this.database
      .getClient()
      .from('novels')
      .delete()
      .eq('id', id);

    return {
      success: true,
    };
  }

  async incrementChapterCount(
  novelId: string,
) {
  const { error } = await this.database
    .getClient()
    .rpc('increment_chapter_count', {
      novel_uuid: novelId,
    });

  if (error) {
    throw error;
  }
}

async decrementChapterCount(
  novelId: string,
) {
  const supabase = this.database.getClient();

  const { data: novel, error } = await supabase
    .from('novels')
    .select('total_chapters')
    .eq('id', novelId)
    .single();

  if (error) throw error;

  await supabase
    .from('novels')
    .update({
      total_chapters: Math.max(
        (novel.total_chapters ?? 1) - 1,
        0,
      ),
      updated_at: new Date(),
    })
    .eq('id', novelId);
}

async incrementPublishedCount(
  novelId: string,
) {
  const supabase = this.database.getClient();

  const { data: novel, error } = await supabase
    .from('novels')
    .select('published_chapters')
    .eq('id', novelId)
    .single();

  if (error) throw error;

  await supabase
    .from('novels')
    .update({
      published_chapters:
        (novel.published_chapters ?? 0) + 1,
      updated_at: new Date(),
    })
    .eq('id', novelId);
}

async decrementPublishedCount(
  novelId: string,
) {
  const supabase = this.database.getClient();

  const { data: novel, error } = await supabase
    .from('novels')
    .select('published_chapters')
    .eq('id', novelId)
    .single();

  if (error) throw error;

  await supabase
    .from('novels')
    .update({
      published_chapters: Math.max(
        (novel.published_chapters ?? 1) - 1,
        0,
      ),
      updated_at: new Date(),
    })
    .eq('id', novelId);
}

async updateWordCount(
  novelId: string,
  difference: number,
) {
  const supabase = this.database.getClient();

  const { data: novel, error } = await supabase
    .from('novels')
    .select('word_count')
    .eq('id', novelId)
    .single();

  if (error) throw error;

  await supabase
    .from('novels')
    .update({
      word_count: Math.max(
        (novel.word_count ?? 0) + difference,
        0,
      ),
      updated_at: new Date(),
    })
    .eq('id', novelId);
}
}