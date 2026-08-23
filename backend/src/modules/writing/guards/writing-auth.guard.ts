import {
  CanActivate,
  ExecutionContext,
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

    request.user = data.user;

    return true;
  }
}