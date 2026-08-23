import {
  Injectable,
} from '@nestjs/common';

import {
  ParsedDocument,
} from '../../interfaces/document.interface';

@Injectable()
export class ContentCleanerService {
  clean(
    document: ParsedDocument,
  ): ParsedDocument {
    return {
      ...document,

      title:
        this.cleanText(
          document.title,
        ),

      author:
        this.cleanText(
          document.author,
        ),

      description:
        this.cleanText(
          document.description,
        ),

      chapters:
        document.chapters
          .map(
            (
              chapter,
              index,
            ) => ({
              ...chapter,

              title:
                this.cleanText(
                  chapter.title,
                ) ||
                `Chapter ${index + 1}`,

              content:
                this.cleanContent(
                  chapter.content,
                ),

              order:
                index + 1,
            }),
          )
          .filter(
            chapter =>
              chapter.content.length > 0,
          ),
    };
  }

  private cleanText(
    value?: string,
  ) {
    if (!value) {
      return undefined;
    }

    return value
      .replace(
        /\r\n/g,
        '\n',
      )
      .replace(
        /\r/g,
        '\n',
      )
      .replace(
        /\t/g,
        ' ',
      )
      .replace(
        /[ ]{2,}/g,
        ' ',
      )
      .trim();
  }

  private cleanContent(
    value: string,
  ) {
    return value
      .replace(
        /\r\n/g,
        '\n',
      )
      .replace(
        /\r/g,
        '\n',
      )
      .replace(
        /\t/g,
        ' ',
      )
      .replace(
        /[ ]{2,}/g,
        ' ',
      )
      .replace(
        /\n[ ]+/g,
        '\n',
      )
      .replace(
        /[ ]+\n/g,
        '\n',
      )
      .replace(
        /\n{3,}/g,
        '\n\n',
      )
      .trim();
  }
}