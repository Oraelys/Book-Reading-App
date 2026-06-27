import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TestModule } from './test/test.module';
import { BooksModule } from './books/books.module';
import { ProcessingModule } from './processing/processing.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    TestModule,
    BooksModule,
    ProcessingModule,
  ],
})
export class AppModule {}