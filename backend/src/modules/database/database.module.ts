import { Module } from '@nestjs/common';

import { SupabaseService } from './supabase.service';
import { DatabaseController } from './database.controller';
import { DatabaseInspectorService } from './database-inspector.service';

@Module({
  controllers: [
    DatabaseController,
  ],

  providers: [
    SupabaseService,
    DatabaseInspectorService,
  ],

  exports: [
    SupabaseService,
    DatabaseInspectorService,
  ],
})
export class DatabaseModule {}