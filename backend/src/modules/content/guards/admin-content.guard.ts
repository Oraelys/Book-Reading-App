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

  const user = data.user;

console.log('Authenticated user:', {
  id: user.id,
  email: user.email,
  appMetadata: user.app_metadata,
});

const role =
  user.app_metadata?.role;

    request.user = user;

    return true;
  }
}