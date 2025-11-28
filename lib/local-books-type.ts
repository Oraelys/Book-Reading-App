export type LocalBook = {
  id: string;
  title: string;
  fileUri: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;

  // Add optional reading progress
  progress?: number; // 0 = start, 1 = finished
};
