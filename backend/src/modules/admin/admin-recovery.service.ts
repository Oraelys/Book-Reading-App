import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AdminRecoveryService {
  constructor(
    private readonly database: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async bootstrapOrRecoverAdmin(
    userId: string,
    suppliedSecret: string | undefined,
  ) {
    this.assertSecret(suppliedSecret);

    if (!this.isUuid(userId)) {
      throw new BadRequestException('userId must be a valid UUID.');
    }

    const client = this.database.getClient();

    const { data: admins, error: adminLookupError } = await client
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminLookupError) {
      throw new ConflictException(
        'Unable to inspect the current administrator state.',
      );
    }

    const hasExistingAdmin = (admins ?? []).length > 0;
    const expectedSecret = hasExistingAdmin
      ? this.config.get<string>('ADMIN_RECOVERY_SECRET')
      : this.config.get<string>('ADMIN_BOOTSTRAP_SECRET');

    if (!expectedSecret) {
      throw new ConflictException(
        hasExistingAdmin
          ? 'ADMIN_RECOVERY_SECRET is not configured on the backend.'
          : 'ADMIN_BOOTSTRAP_SECRET is not configured on the backend.',
      );
    }

    if (!this.secretsMatch(suppliedSecret, expectedSecret)) {
      throw new UnauthorizedException('Invalid administrator recovery secret.');
    }

    const { data: targetProfile, error: targetLookupError } = await client
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (targetLookupError) {
      throw new ConflictException(
        'Unable to locate the requested administrator profile.',
      );
    }

    if (!targetProfile) {
      throw new BadRequestException(
        'The requested user must have an existing profile before promotion.',
      );
    }

    const { error: updateError } = await client
      .from('profiles')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      throw new ConflictException(
        'Unable to assign administrator privileges to the requested profile.',
      );
    }

    return {
      success: true,
      mode: hasExistingAdmin ? 'recovery' : 'bootstrap',
      userId,
      previousRole: targetProfile.role,
      role: 'admin',
    };
  }

  private assertSecret(
    suppliedSecret: string | undefined,
  ): asserts suppliedSecret is string {
    if (!suppliedSecret) {
      throw new UnauthorizedException(
        'Administrator recovery secret is required.',
      );
    }
  }

  private secretsMatch(left: string, right: string): boolean {
    const leftHash = createHash('sha256').update(left).digest();
    const rightHash = createHash('sha256').update(right).digest();
    return timingSafeEqual(leftHash, rightHash);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
