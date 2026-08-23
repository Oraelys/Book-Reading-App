export interface ParsedDocument {

    title?: string;

    author?: string;

    description?: string;

    coverImage?: string;

    language?: string;

    chapters: ParsedChapter[];

}

export interface ParsedChapter {

    title: string;

    content: string;

    order: number;

}