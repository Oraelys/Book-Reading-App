import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { DraftService } from '../services/draft.service';
import { WritingAuthGuard } from '../guards/writing-auth.guard';
import { WritingAuthorizationService } from '../services/writing-authorization.service';

@Controller('writing/drafts')
@UseGuards(WritingAuthGuard)
export class DraftController {
  constructor(
    private readonly drafts:
      DraftService,

    private readonly authorization:
      WritingAuthorizationService,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      novelId: string;
      title?: string;
    },

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        body.novelId,
        request.user.id,
      );

    return this.drafts.create(
      body.novelId,
      body.title,
    );
  }

  @Get(':draftId')
  async get(
    @Param('draftId')
    draftId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertDraftOwner(
        draftId,
        request.user.id,
      );

    return this.drafts.get(
      draftId,
    );
  }

  @Get('novel/:novelId')
  async getNovelDrafts(
    @Param('novelId')
    novelId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        novelId,
        request.user.id,
      );

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

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertDraftOwner(
        draftId,
        request.user.id,
      );

    return this.drafts.save(
      draftId,
      body.content,
    );
  }

  @Patch(':draftId/title')
  async updateTitle(
    @Param('draftId')
    draftId: string,

    @Body()
    body: {
      title: string;
    },

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertDraftOwner(
        draftId,
        request.user.id,
      );

    return this.drafts.updateTitle(
      draftId,
      body.title,
    );
  }

  @Post(':draftId/submit')
  async submit(
    @Param('draftId')
    draftId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertDraftOwner(
        draftId,
        request.user.id,
      );

    return this.drafts.submit(
      draftId,
    );
  }

  @Delete(':draftId')
  async delete(
    @Param('draftId')
    draftId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertDraftOwner(
        draftId,
        request.user.id,
      );

    return this.drafts.delete(
      draftId,
    );
  }
}