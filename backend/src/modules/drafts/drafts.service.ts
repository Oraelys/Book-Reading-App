import { Injectable } from '@nestjs/common';
import {SupabaseService} from 'src/modules/database/supabase.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@Injectable()
export class DraftsService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async create(dto: CreateDraftDto) {
    const supabase = this.database.getClient();

    const { data, error } = await supabase
      .from('story_drafts')
      .insert({
        novel_id: dto.novelId,
        title: dto.title ?? 'Untitled Chapter',
        chapter_order: dto.chapterOrder ?? 1,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('admin_events').insert({
      event_type: 'draft_created',
      title: 'Draft Created',
      message: `Draft "${data.title}" created.`,
    });

    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.database
      .getClient()
      .from('story_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  }

  async update(id: string, dto: UpdateDraftDto) {
    const { data, error } = await this.database
      .getClient()
      .from('story_drafts')
      .update({
        title: dto.title,
        content: dto.content,
        word_count: dto.wordCount,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async remove(id: string) {
    await this.database
      .getClient()
      .from('story_drafts')
      .delete()
      .eq('id', id);

    return {
      success: true,
    };
  }
}