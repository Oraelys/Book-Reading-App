import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
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
      .select('is_suspended')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new ForbiddenException('Unable to verify account status.');
    }
    if (profile.is_suspended === true) {
      throw new ForbiddenException('This account has been suspended.');
    }

    request.user = data.user;

    return true;
  }
}