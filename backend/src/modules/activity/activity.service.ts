import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { TrainingService } from '../training/training.service';

import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly database: SupabaseService,
    private readonly training: TrainingService,
  ) {}

  /**
   * Record activity for the authenticated user.
   * userId comes from the controller's validated Supabase session.
   */
  async track(dto: CreateActivityDto, userId: string) {
    const supabase = this.database.getClient();

    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: dto.type,
        novel_id: dto.novelId,
        chapter_id: dto.chapterId,
        metadata: dto.metadata,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Unable to record activity.');
    }

    // Queue training only for the authenticated user.
    await this.training.enqueue(userId);

    return data;
  }

  /**
   * User timeline.
   * The controller verifies that the caller owns this timeline
   * or has the administrator role.
   */
  async history(userId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve activity history.',
      );
    }

    return data ?? [];
  }

  /**
   * Cross-user activity for a novel.
   * The controller restricts this endpoint to administrators.
   */
  async novelHistory(novelId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .select('*')
      .eq('novel_id', novelId)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve novel activity.',
      );
    }

    return data ?? [];
  }

  /**
   * Delete only a record owned by the authenticated user.
   */
  async remove(id: string, userId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('Unable to delete activity.');
    }

    if (!data) {
      throw new NotFoundException(
        'Activity not found or you do not own this record.',
      );
    }

    return {
      success: true,
    };
  }
}
