import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';

import { AdminRecoveryService } from './admin-recovery.service';

interface RecoverAdminBody {
  userId?: string;
}

@Controller('admin/recovery')
export class AdminRecoveryController {
  constructor(
    private readonly adminRecoveryService: AdminRecoveryService,
  ) {}

  @Post('bootstrap-or-recover')
  bootstrapOrRecover(
    @Body() body: RecoverAdminBody,
    @Headers('x-admin-recovery-secret') secret?: string,
  ) {
    return this.adminRecoveryService.bootstrapOrRecoverAdmin(
      body.userId ?? '',
      secret,
    );
  }
}
