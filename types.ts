export interface MediaItem {
  uid: string;
  name: string;
  date: string; // ISO date string
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  originalUrl?: string;
  aiTitle: string | null;
  aiTags: string[] | null;
  isFavorite: boolean;
}