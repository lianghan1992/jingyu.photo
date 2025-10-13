export interface ImageMetadata {
  width?: number;
  height?: number;
  cameraMake?: string | null;
  cameraModel?: string | null;
  focalLength?: string | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  iso?: number | null;
}

export interface VideoMetadata {
  width?: number;
  height?: number;
  duration?: number; // in seconds
  fps?: number;
}

export interface MediaItem {
  uid: string;
  file_name: string;
  media_created_at: string; // ISO date string
  file_type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  hlsPlaybackUrl: string | null;
  ai_title: string | null;
  ai_tags: string[] | null;
  is_favorite: boolean;
  media_metadata: (ImageMetadata | VideoMetadata) | null;
}
