import { Injectable } from '@nestjs/common';

import {
    ChapterVersionService,
} from './chapter-version.service';

@Injectable()
export class ChapterHistoryService {

    constructor(
        private readonly versions:
            ChapterVersionService,
    ) {}

    async history(
        chapterId: string,
    ) {
        return this.versions.versions(
            chapterId,
        );
    }

    async latest(
        chapterId: string,
    ) {
        return this.versions.latest(
            chapterId,
        );
    }

    async restore(
        versionId: string,
    ) {
        return this.versions.restore(
            versionId,
        );
    }

    async delete(
        versionId: string,
    ) {
        return this.versions.delete(
            versionId,
        );
    }

    async clear(
        chapterId: string,
    ) {
        return this.versions.clear(
            chapterId,
        );
    }

    async prune(
        chapterId: string,
        keep = 100,
    ) {
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
}