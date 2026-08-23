export class UpdateStoryDto {

    title?: string;

    description?: string;

    coverImage?: string;

    category?: string;

    visibility?:
        | 'public'
        | 'private'
        | 'unlisted';

}