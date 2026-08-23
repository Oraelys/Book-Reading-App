import {
  Module,
} from '@nestjs/common';

import {
  DatabaseModule,
} from '../database/database.module';

import {
  UploadsModule,
} from '../uploads/uploads.module';

import {
  ProcessingModule,
} from '../../processing/processing.module';

import {
  ContentController,
} from './content.controller';

import {
  ContentService,
} from './content.service';

import {
  FileDetectorService,
} from './providers/file-detector.service';

import {
  ContentPipelineService,
} from './providers/content-pipeline.service';

import {
  ContentStorageService,
} from './providers/content-storage.service';

import {
  TxtParserService,
} from './providers/parsers/txt-parser.service';

import {
  DocxParserService,
} from './providers/parsers/docx-parser.service';

import {
  EpubParserService,
} from './providers/parsers/epub-parser.service';

import {
  ParserFactoryService,
} from './providers/parsers/parser-factory.service';

import {
  ContentCleanerService,
} from './providers/processing/content-cleaner.service';

import {
  ChapterDetectorService,
} from './providers/processing/chapter-detector.service';

import {
  ChapterSplitterService,
} from './providers/processing/chapter-splitter.service';
import { ChapterPublishingService } from './providers/chapter-publishing.service';

@Module({
  imports: [
    DatabaseModule,
    UploadsModule,
    ProcessingModule,
  ],

  controllers: [
    ContentController,
  ],

  providers: [
    ContentService,

    FileDetectorService,

    ContentPipelineService,

    ContentStorageService,

    TxtParserService,

    DocxParserService,

    EpubParserService,

    ParserFactoryService,

    ContentCleanerService,

    ChapterDetectorService,

    ChapterSplitterService,

    ChapterPublishingService,
  ],

  exports: [
    ContentService,
  ],
})
export class ContentModule {}