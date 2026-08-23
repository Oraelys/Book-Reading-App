import { Injectable } from '@nestjs/common';

import { CHAPTER_PATTERNS } from './chapter-patterns';

@Injectable()
export class ChapterDetectorService {

    isChapterHeading(
        line: string,
    ): boolean {

        const value =
            line.trim();

        return CHAPTER_PATTERNS.some(
            pattern =>
                pattern.test(value),
        );

    }

}