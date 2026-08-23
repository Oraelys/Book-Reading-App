import { Injectable } from '@nestjs/common';

import { SupabaseService } from './supabase.service';

@Injectable()
export class DatabaseInspectorService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async getTables() {
    const { data, error } = await this.database
      .getClient()
      .rpc('get_database_tables');

    if (error) {
      throw error;
    }

    return data;
  }

  async getTableColumns(tableName?: string) {
    const { data, error } = await this.database
      .getClient()
      .rpc('get_database_columns', {
        target_table: tableName ?? null,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  async getForeignKeys() {
    const { data, error } = await this.database
      .getClient()
      .rpc('get_database_foreign_keys');

    if (error) {
      throw error;
    }

    return data;
  }

  async getIndexes() {
    const { data, error } = await this.database
      .getClient()
      .rpc('get_database_indexes');

    if (error) {
      throw error;
    }

    return data;
  }

  async getRlsPolicies() {
    const { data, error } = await this.database
      .getClient()
      .rpc('get_database_rls_policies');

    if (error) {
      throw error;
    }

    return data;
  }

  async getFullSchema() {
    const [
      tables,
      columns,
      foreignKeys,
      indexes,
      policies,
    ] = await Promise.all([
      this.getTables(),
      this.getTableColumns(),
      this.getForeignKeys(),
      this.getIndexes(),
      this.getRlsPolicies(),
    ]);

    return {
      tables,
      columns,
      foreignKeys,
      indexes,
      policies,
    };
  }
}