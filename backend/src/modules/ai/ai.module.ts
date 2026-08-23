import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { FeaturesModule } from '../features/features.module';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';

import { ModelLoaderService } from './providers/model-loader.service';
import { InferenceService } from './providers/inference.service';
import { PreprocessingService } from './providers/preprocessing.service';
import { TensorflowService } from './providers/tensorflow.service';
import { TrainingModule } from '../training/training.module';


import { FeatureVectorService } from './providers/feature-vector.service';
import { RankingService } from './providers/ranking.service';
import { ModelCacheService } from './providers/model-cache.service';
import { EmbeddingService } from './providers/embedding.service';
import { EmbeddingBuilderService } from './providers/embedding-builder.service';
import { CosineSimilarityService } from './providers/cosine-similarity.service';
import { EmbeddingTrainerService } from './providers/embedding-trainer.service';
import { NegativeSamplingService } from './providers/negative-sampling.service';
import { BatchGeneratorService } from './providers/batch-generator.service';
import { TwoTowerModelService } from './providers/two-tower-model.service';
import { TrainingSampleBuilderService } from './providers/training-sample-builder.service';
import { VectorIndexService } from './providers/vector-index.service';
import { VectorLoaderService } from './providers/vector-loader.service';
import { NearestNeighborService } from './providers/nearest-neighbor.service';
import { VectorBootstrapService } from './providers/vector-bootstrap.service';
import { InMemoryVectorEngineService } from './providers/in-memory-vector-engine.service';
import { VectorEngineService } from './providers/vector-engine.service';
import { SessionBuilderService } from './providers/session-builder.service';
import { SequenceDatasetService } from './providers/sequence-dataset.service';
import { SequenceEncoderService } from './providers/sequence-encoder.service';
import { NextStoryPredictorService } from './providers/next-story-predictor.service';
import { TransformerModelService } from './providers/transformer-model.service';
import { SequencePaddingService } from './providers/sequence-padding.service';
import { SequenceTensorBuilderService } from './providers/sequence-tensor-builder.service';
import { TransformerTrainingService } from './providers/transformer-training.service';
import { PositionalEncodingService } from './providers/positional-encoding.service';
import { ScaledDotProductService } from './providers/scaled-dot-product.service';
import { MultiHeadAttentionService } from './providers/multi-head-attention.service';
import { FeedForwardNetworkService } from './providers/feed-forward-network.service';
import { LayerNormalizationService } from './providers/layer-normalization.service';
import { ResidualConnectionService } from './providers/residual-connection.service';
import { TransformerEncoderBlockService } from './providers/transformer-encoder-block.service';
import { TransformerStackService } from './providers/transformer-stack.service';
import { SequencePoolingService } from './providers/sequence-pooling.service';

@Module({
  imports: [
    DatabaseModule,
    FeaturesModule,
    TrainingModule,
  ],

  controllers: [
    AiController,
  ],

  providers: [
    AiService,
    ModelLoaderService,
    InferenceService,
    PreprocessingService,
    TensorflowService,
    FeatureVectorService,
    RankingService,
    ModelCacheService,
    EmbeddingService, 
    EmbeddingBuilderService,
    CosineSimilarityService,
    EmbeddingTrainerService,
    NegativeSamplingService,
    BatchGeneratorService,
    TwoTowerModelService,
    TrainingSampleBuilderService,
    VectorIndexService,
    VectorLoaderService,
    NearestNeighborService,
    VectorBootstrapService,
    InMemoryVectorEngineService,
    VectorEngineService,
    SessionBuilderService,
    SequenceDatasetService,
    SequenceEncoderService,
    NextStoryPredictorService,
    TransformerModelService,
    SequencePaddingService,
    SequenceTensorBuilderService,
    TransformerTrainingService,
    PositionalEncodingService,
    ScaledDotProductService,
    MultiHeadAttentionService,
    FeedForwardNetworkService,
    LayerNormalizationService,
    ResidualConnectionService,
    TransformerEncoderBlockService,
    TransformerStackService,
    SequencePoolingService,
  ],

  exports: [
    AiService,
    ModelLoaderService,
    ModelCacheService,
    InferenceService,
    FeatureVectorService,
    RankingService,
    EmbeddingService,
    TensorflowService,
    EmbeddingBuilderService,
    CosineSimilarityService,
    EmbeddingTrainerService,
    NegativeSamplingService,
    BatchGeneratorService,
    TwoTowerModelService,
    TrainingSampleBuilderService,
    VectorIndexService,
    VectorLoaderService,
    NearestNeighborService,
    VectorBootstrapService,
    VectorEngineService,
    SessionBuilderService,
    SequenceDatasetService,
    SequenceEncoderService,
    NextStoryPredictorService,
    TransformerTrainingService,
    TransformerModelService,
    PositionalEncodingService,
    MultiHeadAttentionService,
    LayerNormalizationService,
    TransformerEncoderBlockService,
    TransformerStackService,
    SequencePoolingService,
  ],
})
export class AiModule {}