
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

import { CreateStoryDto } from '../dto/create-story.dto';
import { UpdateStoryDto } from '../dto/update-story.dto';

@Injectable()
export class WritingService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  /**
   * Create a story owned by the authenticated user.
   *
   * Ownership is derived from authentication rather
   * than accepted from client input.
   */
  async createStory(
    dto: CreateStoryDto,
    userId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data,
      error,
    } = await supabase
      .from('novels')
      .insert({
        title: dto.title,
        description:
          dto.description ?? null,
        cover_image_url:
          dto.coverImage ?? null,
        author_id: userId,
        category: dto.category,
        is_public:
          dto.visibility === 'public',
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateStory(
    id: string,
    dto: UpdateStoryDto,
  ) {
    const supabase =
      this.database.getClient();

    const updateData:
      Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.description !== undefined) {
      updateData.description =
        dto.description;
    }

    if (dto.coverImage !== undefined) {
      updateData.cover_image_url =
        dto.coverImage;
    }

    if (dto.category !== undefined) {
      updateData.category =
        dto.category;
    }

    if (dto.visibility !== undefined) {
      updateData.is_public =
        dto.visibility === 'public';
    }

    const {
      data,
      error,
    } = await supabase
      .from('novels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async story(id: string) {
    const supabase =
      this.database.getClient();

    const {
      data,
      error,
    } = await supabase
      .from('novels')
      .select(`
        *,
        chapters(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(
        'Story not found.',
      );
    }

    return data;
  }

  /**
   * Return only stories belonging to the
   * authenticated author.
   */
  async stories(userId: string) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('author_id', userId)
      .order('updated_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async deleteStory(
    id: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  }
}

