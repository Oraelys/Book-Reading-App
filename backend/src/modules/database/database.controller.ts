import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { DatabaseInspectorService } from './database-inspector.service';

@Controller('database')
export class DatabaseController {
  constructor(
    private readonly inspector: DatabaseInspectorService,
  ) {}

  @Get('schema')
  async schema() {
    return this.inspector.getFullSchema();
  }

  @Get('tables')
  async tables() {
    return this.inspector.getTables();
  }

  @Get('columns')
  async columns() {
    return this.inspector.getTableColumns();
  }

  @Get('columns/:table')
  async tableColumns(
    @Param('table') table: string,
  ) {
    return this.inspector.getTableColumns(table);
  }

  @Get('foreign-keys')
  async foreignKeys() {
    return this.inspector.getForeignKeys();
  }

  @Get('indexes')
  async indexes() {
    return this.inspector.getIndexes();
  }

  @Get('policies')
  async policies() {
    return this.inspector.getRlsPolicies();
  }
}