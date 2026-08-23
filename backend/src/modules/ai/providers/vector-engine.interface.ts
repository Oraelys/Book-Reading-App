export interface VectorSearchResult {

    id: string;

    score: number;

}

export interface VectorEngine {

    initialize(): Promise<void>;

    add(
        id: string,
        embedding: number[],
    ): Promise<void>;

    update(
        id: string,
        embedding: number[],
    ): Promise<void>;

    remove(
        id: string,
    ): Promise<void>;

    search(
        embedding: number[],
        limit?: number,
    ): Promise<VectorSearchResult[]>;

}