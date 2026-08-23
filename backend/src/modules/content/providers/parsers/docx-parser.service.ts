import { Injectable } from '@nestjs/common';

import mammoth from 'mammoth';

import { ContentParser } from './parser.interface';
import { ParsedDocument } from '../../interfaces/document.interface';

@Injectable()
export class DocxParserService
implements ContentParser {

    async parse(
        file: string,
    ): Promise<ParsedDocument> {

        const result =
            await mammoth.extractRawText({

                path: file,

            });

        return {

            chapters: [

                {

                    title: 'Untitled',

                    content: result.value,

                    order: 1,

                },

            ],

        };

    }

}