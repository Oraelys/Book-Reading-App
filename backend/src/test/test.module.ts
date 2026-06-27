import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TestController } from './test.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TestController],
})
export class TestModule {}