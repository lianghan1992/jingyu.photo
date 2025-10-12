import type { MediaItem } from '../types';

const API_BASE = '/api';

interface FetchMediaParams {
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest';
  type?: 'image' | 'video' | 'all';
  favoritesOnly?: boolean;
  search?: string;
  folder?: string | null;
}

interface FetchMediaResponse {
  total: number;
  page: number;
  pageSize: number;
  items: MediaItem[];
}

export async function fetchMedia(params: FetchMediaParams): Promise<FetchMediaResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params.sort) query.append('sort', params.sort);
  if (params.type && params.type !== 'all') query.append('type', params.type);
  if (params.favoritesOnly) query.append('favoritesOnly', 'true');
  if (params.search) query.append('search', params.search);
  if (params.folder) query.append('folder', params.folder);

  const response = await fetch(`${API_BASE}/media?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch media');
  }
  const data = await response.json();

  const mappedItems = data.items.map((item: any) => ({
    ...item,
    originalUrl: `${API_BASE}/media/${item.uid}/download`
  }));
  
  return { ...data, items: mappedItems };
}

export async function toggleFavorite(uid: string, isFavorite: boolean): Promise<Response> {
  const url = `${API_BASE}/media/${uid}/favorite`;
  const method = isFavorite ? 'DELETE' : 'POST';
  
  const response = await fetch(url, { method });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to ${isFavorite ? 'remove from' : 'add to'} favorites`);
  }
  return response;
}

export async function fetchFolders(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/folders`);
    if(!response.ok) {
        throw new Error('Failed to fetch folders');
    }
    return response.json();
}
