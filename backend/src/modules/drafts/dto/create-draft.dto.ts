import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDraftDto {
  @IsUUID()
  novelId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  chapterOrder?: number;
}