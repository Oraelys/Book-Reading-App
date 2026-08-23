import {
  Injectable,
} from '@nestjs/common';

import { extname } from 'path';

import { SupabaseService } from '../database/supabase.service';

import { StorageService } from './services/storage.service';
import { ImageService } from './services/image.service';
import { MediaValidationService } from './services/media-validation.service';

import { MediaFile } from './interfaces/media-file.interface';

@Injectable()
export class MediaService {
  constructor(
    private readonly database: SupabaseService,
    private readonly storage: StorageService,
    private readonly images: ImageService,
    private readonly validator: MediaValidationService,
  ) {}

  async uploadImage(
    ownerId: string,
    folder: string,
    file: MediaFile,
  ) {
    this.validator.validateImage(file);

    const optimized =
      await this.images.optimize(
        file.buffer,
      );

    const extension = extname(
      file.originalname,
    ).replace('.', '');

    const upload =
      await this.storage.upload(
        folder,
        optimized,
        extension,
        file.mimetype,
      );

    const supabase =
      this.database.getClient();

    const { data, error } =
      await supabase
        .from('media')
        .insert({
          owner_id: ownerId,

          type: 'image',

          bucket: 'book-assets',

          folder,

          filename: upload.filename,

          original_filename:
            file.originalname,

          mime_type:
            file.mimetype,

          extension,

          file_size:
            file.size,

          storage_path:
            upload.path,

          public_url:
            upload.url,
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteMedia(
    mediaId: string,
  ) {
    const supabase =
      this.database.getClient();

    const { data, error } =
      await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

    if (error) {
      throw error;
    }

    await this.storage.delete(
      data.storage_path,
    );

    await supabase
      .from('media')
      .delete()
      .eq('id', mediaId);

    return {
      success: true,
    };
  }

  async getMedia(
    id: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async listUserMedia(
    ownerId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('media')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    return data;
  }
}