import {
  Injectable,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {

  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * ==========================================
   * Create Notification
   * ==========================================
   */

  async create(dto: CreateNotificationDto) {

    const { data, error } =
      await this.database
        .getClient()
        .from('notifications')
        .insert({
          recipient_id: dto.recipientId,
          sender_id: dto.senderId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          reference_id: dto.referenceId,
          reference_type: dto.referenceType,
          metadata: dto.metadata,
        })
        .select()
        .single();

    if (error) throw error;

    /*
     * Future integrations
     */

    // await this.sendPush(data);

    // await this.sendEmail(data);

    // await this.sendSMS(data);

    return data;
  }

  /*
   * ==========================================
   * Notification Feed
   * ==========================================
   */

  async findAll(userId: string) {

    const { data, error } =
      await this.database
        .getClient()
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', {
          ascending: false,
        });

    if (error) throw error;

    return data;
  }

  /*
   * ==========================================
   * Unread Notifications
   * ==========================================
   */

  async unread(userId: string) {

    const { data, error } =
      await this.database
        .getClient()
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', {
          ascending: false,
        });

    if (error) throw error;

    return data;
  }

  /*
   * ==========================================
   * Unread Count
   * ==========================================
   */

  async unreadCount(userId: string) {

    const { count } =
      await this.database
        .getClient()
        .from('notifications')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('recipient_id', userId)
        .eq('is_read', false);

    return {
      unread: count ?? 0,
    };
  }

  /*
   * ==========================================
   * Mark Read
   * ==========================================
   */

  async markRead(id: string) {

    const { data, error } =
      await this.database
        .getClient()
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return data;
  }

  /*
   * ==========================================
   * Mark All Read
   * ==========================================
   */

  async markAllRead(userId: string) {

    await this.database
      .getClient()
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date(),
      })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    return {
      success: true,
    };
  }

  /*
   * ==========================================
   * Delete Notification
   * ==========================================
   */

  async remove(id: string) {

    await this.database
      .getClient()
      .from('notifications')
      .delete()
      .eq('id', id);

    return {
      success: true,
    };
  }
}