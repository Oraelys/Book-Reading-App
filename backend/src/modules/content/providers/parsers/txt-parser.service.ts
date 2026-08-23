import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';

import { ContentParser } from './parser.interface';
import { ParsedDocument } from '../../interfaces/document.interface';

@Injectable()
export class TxtParserService implements ContentParser {

    async parse(
        file: string,
    ): Promise<ParsedDocument> {

        const text =
            await fs.readFile(
                file,
                'utf8',
            );

        return {

            chapters: [

                {

                    title: 'Untitled',

                    content: text,

                    order: 1,

                },

            ],

        };

    }

}