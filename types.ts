export interface MediaItem {
  id: string;
  name: string;
  date: string; // ISO date string
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  // Fix: Added optional `originalUrl` property to support high-resolution media downloads and resolve type errors in `data/sample-media.ts`.
  originalUrl?: string;
  aiTags: string[];
  isFavorite: boolean;
  metadata?: {
    camera: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
    focalLength: string;
  };
}
