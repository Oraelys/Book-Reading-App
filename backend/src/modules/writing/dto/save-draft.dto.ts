import {
  IsString,
} from 'class-validator';

export class SaveDraftDto {
  @IsString()
  content!: string;
}