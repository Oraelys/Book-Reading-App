import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { FeaturesModule } from '../features/features.module';
import { AiModule } from '../ai/ai.module';

import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationProfileService } from './profile.service';
import { EmbeddingRankingService } from './providers/embedding-ranking.service';
import { CollaborativeFilteringService } from './providers/collaborative-filtering.service';
import { UserSimilarityService } from './providers/user-similarity.service';
import { UserPreferenceService } from './providers/user-preference.service';
import { PreferenceUpdaterService } from './providers/preference-updater.service';

@Module({
  imports: [
    DatabaseModule,
    PreferencesModule,
    FeaturesModule,
    AiModule,   // ← REQUIRED
  ],

  controllers: [
    RecommendationsController,
  ],

  providers: [
    RecommendationsService,
    RecommendationProfileService,
    EmbeddingRankingService,
    UserSimilarityService,
    CollaborativeFilteringService,
    UserPreferenceService,
    PreferenceUpdaterService,
  ],

  exports: [
    RecommendationsService,
    RecommendationProfileService,
    EmbeddingRankingService,
    UserSimilarityService,
    PreferenceUpdaterService,
    UserPreferenceService,
],
})
export class RecommendationsModule {}