import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class AdminContentGuard
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
      authorization
        .substring(7)
        .trim();

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

    const user =
      data.user;

    const role =
      user.app_metadata?.role;

    if (role !== 'admin') {
      throw new ForbiddenException(
        'Administrator access is required.',
      );
    }

    request.user = user;

    return true;
  }
}