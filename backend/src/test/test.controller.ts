import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Controller('test')
export class TestController {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  async testConnection() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  }
}