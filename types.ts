export interface ImageMetadata {
  width?: number;
  height?: number;
  camera_make?: string | null;
  camera_model?: string | null;
  focal_length?: string | null;
  aperture?: string | null;
  shutter_speed?: string | null;
  iso?: number | null;
  date_time_original?: string;
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
  thumbnail_url: string;
  download_url: string;
  hls_playback_url: string | null;
  ai_title: string | null;
  ai_tags: string[] | null;
  is_favorite: boolean;
  media_metadata: (ImageMetadata | VideoMetadata) | null;
}
