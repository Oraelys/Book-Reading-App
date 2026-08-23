import {
  Controller,
  Param,
  Post,
} from '@nestjs/common';

import { PublishingService } from './publishing.service';

@Controller('publishing')
export class PublishingController {
  constructor(
    private readonly publishingService: PublishingService,
  ) {}

  @Post('validate/:novelId')
  validateStory(
    @Param('novelId') novelId: string,
  ) {
    return this.publishingService.validateStory(
      novelId,
    );
  }

  @Post('story/:novelId')
  publishStory(
    @Param('novelId') novelId: string,
  ) {
    return this.publishingService.publishStory(
      novelId,
    );
  }

  @Post('story/:novelId/unpublish')
  unpublishStory(
    @Param('novelId') novelId: string,
  ) {
    return this.publishingService.unpublishStory(
      novelId,
    );
  }

  @Post('chapter/:chapterId')
publishChapter(
  @Param('chapterId') chapterId: string,
) {
  return this.publishingService.publishChapter(
    chapterId,
  );
}

@Post('chapter/:chapterId/unpublish')
unpublishChapter(
  @Param('chapterId') chapterId: string,
) {
  return this.publishingService.unpublishChapter(
    chapterId,
  );
}
}