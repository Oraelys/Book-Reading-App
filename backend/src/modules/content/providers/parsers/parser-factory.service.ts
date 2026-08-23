import { Injectable } from '@nestjs/common';

import { TxtParserService } from './txt-parser.service';
// import { PdfParserService } from './pdf-parser.service';
import { DocxParserService } from './docx-parser.service';
import { EpubParserService } from './epub-parser.service';

import { ContentParser } from './parser.interface';

@Injectable()
export class ParserFactoryService {

    constructor(

        private readonly txt: TxtParserService,

        // private readonly pdf: PdfParserService,

        private readonly docx: DocxParserService,

        private readonly epub: EpubParserService,

    ) {}

    getParser(
        extension: string,
    ): ContentParser {

        switch (extension.toLowerCase()) {

            case 'txt':
                return this.txt;

            case 'docx':
                return this.docx;

            // case 'pdf':
             //   return this.pdf;

            case 'epub':
                return this.epub;

            default:
                throw new Error(
                    `Unsupported file type: ${extension}`,
                );

        }

    }

}