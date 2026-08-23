import {
  Injectable,
} from '@nestjs/common';

import {
  ParsedDocument,
  ParsedChapter,
} from '../../interfaces/document.interface';

import {
  ChapterDetectorService,
} from './chapter-detector.service';

@Injectable()
export class ChapterSplitterService {
  constructor(
    private readonly detector:
      ChapterDetectorService,
  ) {}

  split(
    document: ParsedDocument,
  ): ParsedDocument {
    /*
     * EPUB parsers may already return
     * individual chapters.
     */
    if (
      document.chapters.length > 1
    ) {
      return {
        ...document,

        chapters:
          document.chapters.map(
            (
              chapter,
              index,
            ) => ({
              ...chapter,
              order:
                index + 1,
            }),
          ),
      };
    }

    if (
      document.chapters.length === 0
    ) {
      return document;
    }

    const source =
      document.chapters[0];

    const lines =
      source.content.split('\n');

    const chapters:
      ParsedChapter[] = [];

    let currentTitle =
      'Introduction';

    let currentContent =
      '';

    const pushCurrent =
      () => {
        const content =
          currentContent.trim();

        if (!content) {
          return;
        }

        chapters.push({
          title:
            currentTitle,

          content,

          order:
            chapters.length + 1,
        });
      };

    for (
      const line of lines
    ) {
      if (
        this.detector.isChapterHeading(
          line,
        )
      ) {
        pushCurrent();

        currentTitle =
          line.trim();

        currentContent =
          '';

        continue;
      }

      currentContent +=
        line + '\n';
    }

    pushCurrent();

    /*
     * If no headings were detected,
     * retain the original document
     * as one chapter.
     */
    if (
      chapters.length === 0
    ) {
      return {
        ...document,

        chapters: [
          {
            title:
              source.title ||
              'Chapter 1',

            content:
              source.content.trim(),

            order: 1,
          },
        ],
      };
    }

    return {
      ...document,
      chapters,
    };
  }
}