
import {
  Injectable,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { SearchDto } from './dto/search.dto';

@Injectable()
export class DiscoveryService {

  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * ======================================
   * Global Search
   * ======================================
   */

  async search(dto: SearchDto) {

    const supabase =
      this.database.getClient();

    const limit =
      dto.limit ?? 20;

    const page =
      dto.page ?? 1;

    const from =
      (page - 1) * limit;

    const to =
      from + limit - 1;

    let query = supabase
      .from('novels')
      .select(`
        *,
        profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'published');

    if (dto.query?.trim()) {
      query = query.or(
        `title.ilike.%${dto.query}%,description.ilike.%${dto.query}%`,
      );
    }

    if (dto.category) {
      query = query.eq(
        'category',
        dto.category,
      );
    }

    if (dto.authorId) {
      query = query.eq(
        'author_id',
        dto.authorId,
      );
    }

    const {
      data,
      error,
    } = await query
      .range(from, to)
      .order('popularity_score', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return {
      page,
      limit,
      results: data ?? [],
    };
  }

  /*
   * ======================================
   * Featured
   * ======================================
   */

  async featured() {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .limit(20);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * ======================================
   * Trending
   * ======================================
   */

  async trending() {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .order('trending_score', {
        ascending: false,
      })
      .limit(20);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * ======================================
   * New Releases
   * ======================================
   */

  async newReleases() {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .order('published_at', {
        ascending: false,
      })
      .limit(20);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * ======================================
   * Recently Updated
   * ======================================
   */

  async recentlyUpdated() {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .order('last_activity', {
        ascending: false,
      })
      .limit(20);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * ======================================
   * By Category
   * ======================================
   */

  async byCategory(
    category: string,
  ) {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .order('popularity_score', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * ======================================
   * By Author
   * ======================================
   */

  async byAuthor(
    authorId: string,
  ) {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .eq('author_id', authorId)
      .order('popularity_score', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * ======================================
   * Continue Reading
   * ======================================
   */

  async continueReading(
    userId: string,
  ) {

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('reading_progress')
      .select(`
        *,
        novels!inner(*)
      `)
      .eq('user_id', userId)
      .eq('novels.status', 'published')
      .order('last_read', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}

