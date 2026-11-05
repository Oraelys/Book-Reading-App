import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AdminContentGuard } from '../content/guards/admin-content.guard';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('admin/users')
@UseGuards(AdminContentGuard)
export class AdminUserDetailsController {
  constructor(private readonly database: SupabaseService) {}

  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    if (!UUID_PATTERN.test(userId)) {
      throw new NotFoundException('User not found.');
    }

    const supabase = this.database.getClient();
    const [profileResult, activityResult, suspensionAuditResult, roleAuditResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, user_tag, email, role, is_public, bio, avatar_url, created_at, updated_at, is_suspended, suspended_at, suspended_by, suspension_reason')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_activity_logs')
        .select('id, activity_type, novel_id, chapter_id, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('admin_user_suspension_audit_logs')
        .select('id, actor_user_id, action, reason, created_at')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('admin_role_audit_logs')
        .select('id, actor_user_id, previous_role, new_role, created_at')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (profileResult.error) {
      throw new Error('Unable to retrieve user profile.');
    }
    if (!profileResult.data) {
      throw new NotFoundException('User not found.');
    }
    if (activityResult.error || suspensionAuditResult.error || roleAuditResult.error) {
      throw new Error('Unable to retrieve user history.');
    }

    const profile = profileResult.data;
    return {
      user: {
        id: profile.id,
        username: profile.username ?? null,
        userTag: profile.user_tag ?? null,
        email: profile.email ?? null,
        role: profile.role,
        isPublic: profile.is_public ?? null,
        bio: profile.bio ?? null,
        avatarUrl: profile.avatar_url ?? null,
        createdAt: profile.created_at ?? null,
        updatedAt: profile.updated_at ?? null,
        isSuspended: profile.is_suspended === true,
        suspendedAt: profile.suspended_at ?? null,
        suspendedBy: profile.suspended_by ?? null,
        suspensionReason: profile.suspension_reason ?? null,
      },
      activity: (activityResult.data ?? []).map((item) => ({
        id: item.id,
        activityType: item.activity_type ?? 'unknown',
        novelId: item.novel_id ?? null,
        chapterId: item.chapter_id ?? null,
        metadata: item.metadata ?? null,
        createdAt: item.created_at ?? null,
      })),
      suspensionChanges: (suspensionAuditResult.data ?? []).map((item) => ({
        id: String(item.id),
        actorUserId: item.actor_user_id,
        action: item.action,
        reason: item.reason ?? null,
        createdAt: item.created_at,
      })),
      roleChanges: (roleAuditResult.data ?? []).map((item) => ({
        id: String(item.id),
        actorUserId: item.actor_user_id,
        previousRole: item.previous_role,
        newRole: item.new_role,
        createdAt: item.created_at,
      })),
      activityLimit: 50,
    };
  }
}
