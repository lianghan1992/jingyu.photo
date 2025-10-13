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
    if (response.status === 503) {
      throw new Error('服务暂时不可用 (503)。请检查后端服务是否正在运行。');
    }
    throw new Error('Failed to fetch media');
  }
  const data: FetchMediaResponse = await response.json();
  
  return data;
}

export async function toggleFavorite(uid: string, isFavorite: boolean): Promise<Response> {
  const url = `${API_BASE}/media/${uid}/favorite`;
  const method = isFavorite ? 'DELETE' : 'POST';
  
  const response = await fetch(url, { method });
  if (!response.ok && response.status !== 204) {
    if (response.status === 503) {
      throw new Error('服务暂时不可用 (503)。');
    }
    throw new Error(`Failed to ${isFavorite ? 'remove from' : 'add to'} favorites`);
  }
  return response;
}

export async function fetchFolders(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/folders`);
    if(!response.ok) {
        if (response.status === 503) {
          throw new Error('服务暂时不可用 (503)。');
        }
        throw new Error('Failed to fetch folders');
    }
    return response.json();
}

export async function triggerAiProcessing(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/ai/process`, { method: 'POST' });

    if (!response.ok) {
        if (response.status === 503) {
            throw new Error('服务暂时不可用 (503)。');
        }
        
        let errorMessage = `启动AI处理任务失败 (HTTP ${response.status})`;

        try {
            const errorData = await response.json();
            // Per API.md, error messages can be in `detail.error.message` or `detail`.
            if (errorData.detail?.error?.message) {
                errorMessage = errorData.detail.error.message;
            } else if (typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
            }
        } catch (jsonError) {
            // Ignore JSON parsing error, the default HTTP status message is sufficient.
        }
        throw new Error(errorMessage);
    }
    
    // On success (e.g., 202 Accepted), the API doc does not guarantee a response body.
    // The UI code expects an object with a `message` property.
    try {
        const data = await response.json();
        // Ensure a message is returned to satisfy the UI.
        return { message: data.message || 'AI处理任务已在后台启动。' };
    } catch (e) {
        // If body is empty or not JSON, return a default success message to prevent UI crash.
        return { message: 'AI处理任务已在后台启动。' };
    }
}
