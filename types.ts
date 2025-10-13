export interface ImageMetadata {
  width?: number;
  height?: number;
  cameraMake?: string | null;
  cameraModel?: string | null;
  focalLength?: string | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  iso?: number | null;
  dateTimeOriginal?: string;
}

export interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number; // in seconds
  fps?: number;
}

export interface MediaItem {
  uid: string;
  fileName: string;
  mediaCreatedAt: string; // ISO date string
  fileType: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  hlsPlaybackUrl: string | null;
  aiTitle: string | null;
  aiTags: string[] | null;
  isFavorite: boolean;
  mediaMetadata: (ImageMetadata | VideoMetadata) | null;
}
