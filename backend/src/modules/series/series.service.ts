import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { NovelsService } from '../novels/novels.service';

import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { AddNovelDto } from './dto/add-novel.dto';

@Injectable()
export class SeriesService {
  constructor(
    private readonly database: SupabaseService,
    private readonly novelsService: NovelsService,
  ) {}

  /*
   * ====================================
   * Create Series
   * ====================================
   */

  async create(dto: CreateSeriesDto) {
    const supabase = this.database.getClient();

    const { data, error } = await supabase
      .from('series')
      .insert({
        creator_id: dto.creatorId,
        title: dto.title,
        description: dto.description,
        reading_mode: dto.readingMode ?? 'sequential',
        cover_media_id: dto.coverMediaId,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('admin_events').insert({
      event_type: 'series_created',
      title: 'Series Created',
      message: `Series "${data.title}" created.`,
    });

    return data;
  }

  /*
   * ====================================
   * Get Series
   * ====================================
   */

  async findOne(id: string) {
    const { data, error } = await this.database
      .getClient()
      .from('series')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException('Series not found.');
    }

    return data;
  }

  async findCreatorSeries(creatorId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('series')
      .select('*')
      .eq('creator_id', creatorId)
      .order('updated_at', {
        ascending: false,
      });

    if (error) throw error;

    return data;
  }

  /*
   * ====================================
   * Update Series
   * ====================================
   */

  async update(
    id: string,
    dto: UpdateSeriesDto,
  ) {
    const { data, error } = await this.database
      .getClient()
      .from('series')
      .update({
        title: dto.title,
        description: dto.description,
        reading_mode: dto.readingMode,
        cover_media_id: dto.coverMediaId,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /*
   * ====================================
   * Delete Series
   * ====================================
   */

  async remove(id: string) {
    const supabase = this.database.getClient();

    const { error } = await supabase
      .from('series')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await supabase.from('admin_events').insert({
      event_type: 'series_deleted',
      title: 'Series Deleted',
      message: `Series ${id} deleted.`,
    });

    return {
      success: true,
    };
  }

  /*
   * ====================================
   * Add Novel
   * ====================================
   */

  async addNovel(
    seriesId: string,
    dto: AddNovelDto,
  ) {
    const supabase = this.database.getClient();

    // Ensure novel exists
    await this.novelsService.findOne(dto.novelId);

    const { data: duplicate } = await supabase
      .from('series_stories')
      .select('id')
      .eq('series_id', seriesId)
      .eq('novel_id', dto.novelId)
      .maybeSingle();

    if (duplicate) {
      throw new BadRequestException(
        'Novel already exists in this series.',
      );
    }

    const { data: last } = await supabase
      .from('series_stories')
      .select('display_order')
      .eq('series_id', seriesId)
      .order('display_order', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    const nextOrder = last
      ? last.display_order + 1
      : 1;

    const { data, error } = await supabase
      .from('series_stories')
      .insert({
        series_id: seriesId,
        novel_id: dto.novelId,
        display_order:
          dto.displayOrder ?? nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    await this.incrementStoryCount(seriesId);

    return data;
  }

  /*
   * ====================================
   * Remove Novel
   * ====================================
   */

  async removeNovel(
    seriesId: string,
    novelId: string,
  ) {
    const supabase = this.database.getClient();

    await supabase
      .from('series_stories')
      .delete()
      .eq('series_id', seriesId)
      .eq('novel_id', novelId);

    await this.decrementStoryCount(seriesId);

    return {
      success: true,
    };
  }

  /*
   * ====================================
   * List Stories
   * ====================================
   */

  async getStories(seriesId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('series_stories')
      .select(`
        *,
        novels(*)
      `)
      .eq('series_id', seriesId)
      .order('display_order');

    if (error) throw error;

    return data;
  }

  /*
   * ====================================
   * Reorder Stories
   * ====================================
   */

  async reorder(
    seriesId: string,
    orderedIds: string[],
  ) {
    const supabase = this.database.getClient();

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('series_stories')
        .update({
          display_order: i + 1,
        })
        .eq('series_id', seriesId)
        .eq('novel_id', orderedIds[i]);
    }

    return {
      success: true,
    };
  }

  /*
   * ====================================
   * Helpers
   * ====================================
   */

  private async incrementStoryCount(
    seriesId: string,
  ) {
    const supabase = this.database.getClient();

    const { data } = await supabase
      .from('series')
      .select('total_stories')
      .eq('id', seriesId)
      .single();

    await supabase
      .from('series')
      .update({
        total_stories:
          (data?.total_stories ?? 0) + 1,
      })
      .eq('id', seriesId);
  }

  private async decrementStoryCount(
    seriesId: string,
  ) {
    const supabase = this.database.getClient();

    const { data } = await supabase
      .from('series')
      .select('total_stories')
      .eq('id', seriesId)
      .single();

    await supabase
      .from('series')
      .update({
        total_stories: Math.max(
          (data?.total_stories ?? 1) - 1,
          0,
        ),
      })
      .eq('id', seriesId);
  }
}