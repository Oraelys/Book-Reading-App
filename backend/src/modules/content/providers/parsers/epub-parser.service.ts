import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import {
  ContentParser,
} from './parser.interface';

import {
  ParsedDocument,
  ParsedChapter,
} from '../../interfaces/document.interface';

const EPub =
  require('epub2').EPub;

@Injectable()
export class EpubParserService
  implements ContentParser {

  async parse(
    file: string,
  ): Promise<ParsedDocument> {
    const epub =
      new EPub(file);

    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
        epub.on(
          'end',
          () => resolve(),
        );

        epub.on(
          'error',
          (
            error: Error,
          ) => reject(error),
        );

        epub.parse();
      },
    );

    const chapters:
      ParsedChapter[] = [];

    const flow =
      epub.flow ?? [];

    for (
      let index = 0;
      index < flow.length;
      index++
    ) {
      const item =
        flow[index];

      const chapter =
        await this.readChapter(
          epub,
          item.id,
        );

      if (
        !chapter.trim()
      ) {
        continue;
      }

      chapters.push({
        title:
          this.cleanTitle(
            item.title ||
            `Chapter ${index + 1}`,
          ),

        content:
          this.stripHtml(
            chapter,
          ),

        order:
          chapters.length + 1,
      });
    }

    if (
      chapters.length === 0
    ) {
      throw new BadRequestException(
        'The EPUB did not contain readable chapter content.',
      );
    }

    return {
      title:
        epub.metadata?.title,

      author:
        epub.metadata?.creator,

      language:
        epub.metadata?.language,

      chapters,
    };
  }

  private readChapter(
    epub: any,
    chapterId: string,
  ): Promise<string> {
    return new Promise(
      (
        resolve,
        reject,
      ) => {
        epub.getChapter(
          chapterId,
          (
            error: Error | null,
            text: string,
          ) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(
              text ?? '',
            );
          },
        );
      },
    );
  }

  private stripHtml(
    value: string,
  ) {
    return value
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        '',
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        '',
      )
      .replace(
        /<br\s*\/?>/gi,
        '\n',
      )
      .replace(
        /<\/p>/gi,
        '\n',
      )
      .replace(
        /<[^>]+>/g,
        ' ',
      )
      .replace(
        /&nbsp;/gi,
        ' ',
      )
      .replace(
        /&amp;/gi,
        '&',
      )
      .replace(
        /&lt;/gi,
        '<',
      )
      .replace(
        /&gt;/gi,
        '>',
      )
      .replace(
        /[ \t]+/g,
        ' ',
      )
      .replace(
        /\n\s+/g,
        '\n',
      )
      .trim();
  }

  private cleanTitle(
    title: string,
  ) {
    return title
      .replace(
        /<[^>]+>/g,
        '',
      )
      .trim();
  }
}