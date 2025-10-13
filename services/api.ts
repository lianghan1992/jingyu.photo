import type { MediaItem } from '../types';

const API_BASE = '/api';
const STORAGE_KEY = 'jingyu-today-auth-token';

// A helper function to handle API requests with authorization and error handling.
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem(STORAGE_KEY);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    // If the token is invalid or expired, the server should return 401.
    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      // Force a reload to show the login gate.
      window.location.reload();
      // Throw an error to stop the current execution flow.
      throw new Error('认证失败，请重新登录。');
    }
    // Handle other errors gracefully.
    if (response.status === 503) {
      throw new Error('服务暂时不可用 (503)。请检查后端服务是否正在运行。');
    }
    // Try to parse error from backend
    try {
        const errorData = await response.json();
        if (errorData.detail?.error?.message) {
            throw new Error(errorData.detail.error.message);
        } else if (typeof errorData.detail === 'string') {
            throw new Error(errorData.detail);
        }
    } catch (e) {
      // If parsing fails or it's not the expected format, throw a generic error.
      if (e instanceof Error) throw e;
      throw new Error(`请求失败，状态码: ${response.status}`);
    }
  }

  return response;
}

// New function to fetch media as a blob and return a local URL.
export async function fetchAuthenticatedBlobUrl(url: string): Promise<string> {
    const response = await apiFetch(url);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

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

export async function authenticate(password: string): Promise<string> {
    const response = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('口令不正确');
        }
        throw new Error('认证时发生错误');
    }
    
    const data = await response.json();
    const token = data.access_token || data.token;
    if (!token) {
        throw new Error('未能从服务器获取Token');
    }
    return token;
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

  const response = await apiFetch(`${API_BASE}/media?${query.toString()}`);
  const data: FetchMediaResponse = await response.json();
  
  return data;
}

export async function toggleFavorite(uid: string, isFavorite: boolean): Promise<Response> {
  const url = `${API_BASE}/media/${uid}/favorite`;
  const method = isFavorite ? 'DELETE' : 'POST';
  
  const response = await apiFetch(url, { method });
  return response;
}

export async function fetchFolders(): Promise<string[]> {
    const response = await apiFetch(`${API_BASE}/folders`);
    return response.json();
}

export async function triggerAiProcessing(): Promise<{ message: string }> {
    const response = await apiFetch(`${API_BASE}/ai/process`, { method: 'POST' });
    
    // On success (e.g., 202 Accepted), the API doc does not guarantee a response body.
    try {
        const data = await response.json();
        return { message: data.message || 'AI处理任务已在后台启动。' };
    } catch (e) {
        // If body is empty or not JSON, return a default success message.
        return { message: 'AI处理任务已在后台启动。' };
    }
}
