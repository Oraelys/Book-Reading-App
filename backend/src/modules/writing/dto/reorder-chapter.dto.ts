import { IsInt, IsUUID, Min } from 'class-validator';

export class ReorderChapterDto {
  @IsUUID()
  novelId!: string;

  @IsInt()
  @Min(0)
  position!: number;
}