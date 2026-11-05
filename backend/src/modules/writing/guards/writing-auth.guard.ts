import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class WritingAuthGuard
  implements CanActivate
{
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const authorization =
      request.headers?.authorization;

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException(
        'Authentication token is required.',
      );
    }

    const token =
      authorization.substring(7).trim();

    if (!token) {
      throw new UnauthorizedException(
        'Authentication token is required.',
      );
    }

    const {
      data,
      error,
    } =
      await this.database
        .getClient()
        .auth
        .getUser(token);

    if (
      error ||
      !data?.user
    ) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token.',
      );
    }

    const { data: profile, error: profileError } = await this.database
      .getClient()
      .from('profiles')
      .select('account_status')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new UnauthorizedException('Unable to verify the account profile.');
    }
    if (profile.account_status === 'suspended') {
      throw new ForbiddenException('This account is suspended.');
    }

    request.user = data.user;

    return true;
  }
}