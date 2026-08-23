export interface Chapter {

    id: string;

    storyId: string;

    title: string;

    content: string;

    chapterNumber: number;

    wordCount: number;

    estimatedReadingMinutes: number;

    status:
        | 'draft'
        | 'published';

    createdAt: Date;

    updatedAt: Date;

}