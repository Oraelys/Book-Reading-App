export interface ReaderStatistics {

  booksRead:number;

  chaptersRead:number;

  totalMinutes:number;

  completedBooks:number;

  bookmarks:number;

}

export interface NovelStatistics{

  reads:number;

  uniqueReaders:number;

  completionRate:number;

  averageReadTime:number;

  popularity:number;

}

export interface AuthorStatistics{

  novels:number;

  followers:number;

  totalReads:number;

  totalRevenue:number;

}