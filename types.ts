export interface ImageMetadata {
  width?: number;
  height?: number;
  camera_make?: string | null;
  camera_model?: string | null;
  focal_length?: string | null;
  aperture?: string | null;
  shutter_speed?: string | null;
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
  name: string;
  date: string; // ISO date string
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  aiTitle: string | null;
  aiTags: string[] | null;
  isFavorite: boolean;
  metadata: (ImageMetadata | VideoMetadata) | null;
}