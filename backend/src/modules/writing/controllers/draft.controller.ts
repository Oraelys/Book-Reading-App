import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  DraftService,
} from '../services/draft.service';

@Controller('writing/drafts')
export class DraftController {
  constructor(
    private readonly drafts:
      DraftService,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      novelId: string;
      title?: string;
    },
  ) {
    return this.drafts.create(
      body.novelId,
      body.title,
    );
  }

  @Get(':draftId')
  async get(
    @Param('draftId')
    draftId: string,
  ) {
    return this.drafts.get(
      draftId,
    );
  }

  @Get(
    'novel/:novelId',
  )
  async getNovelDrafts(
    @Param('novelId')
    novelId: string,
  ) {
    return this.drafts
      .getNovelDrafts(
        novelId,
      );
  }

  @Patch(':draftId')
  async save(
    @Param('draftId')
    draftId: string,

    @Body()
    body: {
      content: string;
    },
  ) {
    return this.drafts.save(
      draftId,
      body.content,
    );
  }

  @Patch(
    ':draftId/title',
  )
  async updateTitle(
    @Param('draftId')
    draftId: string,

    @Body()
    body: {
      title: string;
    },
  ) {
    return this.drafts
      .updateTitle(
        draftId,
        body.title,
      );
  }

  @Post(
    ':draftId/submit',
  )
  async submit(
    @Param('draftId')
    draftId: string,
  ) {
    return this.drafts.submit(
      draftId,
    );
  }

  @Delete(':draftId')
  async delete(
    @Param('draftId')
    draftId: string,
  ) {
    return this.drafts.delete(
      draftId,
    );
  }
}