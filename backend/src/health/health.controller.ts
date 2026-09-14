import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'inkwell-backend',
      timestamp: new Date().toISOString(),
    };
  }
}