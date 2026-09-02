
import {
  Injectable,
} from '@nestjs/common';

import {
  ChapterVersionService,
} from './chapter-version.service';

import {
  WritingAuthorizationService,
} from '../services/writing-authorization.service';

@Injectable()
export class ChapterHistoryService {
  constructor(
    private readonly versions:
      ChapterVersionService,

    private readonly authorization:
      WritingAuthorizationService,
  ) {}

  /**
   * Get chapter history.
   */
  async history(
    chapterId: string,
    userId: string,
  ) {
    await this.authorization
      .assertChapterOwner(
        chapterId,
        userId,
      );

    return this.versions.versions(
      chapterId,
    );
  }

  /**
   * Get latest chapter version.
   */
  async latest(
    chapterId: string,
    userId: string,
  ) {
    await this.authorization
      .assertChapterOwner(
        chapterId,
        userId,
      );

    return this.versions.latest(
      chapterId,
    );
  }


  

  /**
   * Restore a version.
   *
   * The version is first resolved to its chapter
   * and that chapter's ownership is verified.
   */
  async restore(
    versionId: string,
    userId: string,
  ) {
    const version =
      await this.getVersion(
        versionId,
      );

    await this.authorization
      .assertChapterOwner(
        version.chapter_id,
        userId,
      );

    return this.versions.restore(
      versionId,
    );
  }

  /**
   * Delete a version.
   */
  async delete(
    versionId: string,
    userId: string,
  ) {
    const version =
      await this.getVersion(
        versionId,
      );

    await this.authorization
      .assertChapterOwner(
        version.chapter_id,
        userId,
      );

    return this.versions.delete(
      versionId,
    );
  }

  /**
   * Delete all versions for a chapter.
   */
  async clear(
    chapterId: string,
    userId: string,
  ) {
    await this.authorization
      .assertChapterOwner(
        chapterId,
        userId,
      );

    return this.versions.clear(
      chapterId,
    );
  }

  /**
   * Keep only the newest `keep` versions.
   */
  async prune(
    chapterId: string,
    userId: string,
    keep = 100,
  ) {
    await this.authorization
      .assertChapterOwner(
        chapterId,
        userId,
      );

    const versions =
      await this.versions.versions(
        chapterId,
      );

    if (
      versions.length <= keep
    ) {
      return {
        success: true,
        deleted: 0,
      };
    }

    const oldVersions =
      versions.slice(keep);

    for (
      const version of oldVersions
    ) {
      await this.versions.delete(
        version.id,
      );
    }

    return {
      success: true,
      deleted:
        oldVersions.length,
    };
  }

  /**
   * Resolve a version to its chapter.
   *
   * This is intentionally kept inside the history
   * service so controllers do not need to know the
   * chapter_versions database structure.
   */
  private async getVersion(
    versionId: string,
  ) {
    return this.versions
      .getVersion(
        versionId,
      );
  }
}

