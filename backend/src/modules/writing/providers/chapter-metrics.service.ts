import { Injectable } from '@nestjs/common';

@Injectable()
export class ChapterMetricsService {
  calculate(content: string) {
    const normalized = content
      .replace(/\s+/g, ' ')
      .trim();

    const wordCount = normalized
      ? normalized.split(' ').length
      : 0;

    const wordsPerMinute = 200;

    const estimatedReadingMinutes =
      wordCount === 0
        ? 0
        : Math.max(
            1,
            Math.ceil(
              wordCount / wordsPerMinute,
            ),
          );

    return {
      wordCount,
      estimatedReadingMinutes,
    };
  }
}