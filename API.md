# 璟聿.today 后端 API 文档

## 简介

本文档为 `璟聿.today` 后端服务提供了详细、真实的API说明。所有接口都经过了实际测试，旨在帮助前端开发者准确地理解和使用这些API。

## 认证

当前版本的 API **无需认证**。

---

## 数据模型

### MediaItem

代表媒体库中的一个项目（图片或视频）。下表中的字段名即为 API 响应中的实际字段名（使用 camelCase 格式）。

| 字段名           | 类型          | 描述                                       |
| ---------------- | ------------- | ------------------------------------------ |
| `uid`            | String        | 媒体项的唯一标识符 (MD5 of file_path)。    |
| `fileName`       | String        | 文件名。                                   |
| `mediaCreatedAt` | String (ISO)  | 媒体的创建日期 (EXIF或文件创建时间)。      |
| `fileType`       | String        | 媒体类型 (`image` 或 `video`)。            |
| `isFavorite`     | Boolean       | 是否已收藏。                               |
| `url`            | String        | 访问原始媒体文件的代理URL。                |
| `thumbnailUrl`   | String        | 访问缩略图的URL (不含尺寸参数)。           |
| `downloadUrl`    | String        | 下载原始媒体文件的URL。                    |
| `hlsPlaybackUrl` | String \| null | (仅对视频) HLS 播放列表的 URL。如果为 `null`，则不支持 HLS。 |
| `aiTitle`        | String \| null | (可选) AI 生成的标题。                     |
| `aiTags`         | Array[String] \| null | (可选) AI 生成的标签列表。                 |
| `mediaMetadata`  | Object \| null | (可选) 包含媒体元数据的对象 (如宽高、相机信息等)。 |

**mediaMetadata 对象结构（视频）：**
```json
{
  "width": 2560,
  "height": 1440,
  "duration": 29.115667,
  "fps": 25
}
```

---

## API 端点

### 1. 获取后台任务状态

查询当前是否有扫描或AI处理任务正在运行。

- **Method:** `GET`
- **Path:** `/api/status`

**响应 (200 OK):**
```json
{
  "is_scanning": true,
  "is_ai_processing": true
}
```

### 2. 获取媒体库统计信息

获取关于媒体库的统计数据，如文件总数和总体积。

- **Method:** `GET`
- **Path:** `/api/stats`

**响应 (200 OK):**
```json
{
  "total": {"count": 251, "size": 18642021537},
  "photo": {"count": 242, "size": 1316754515},
  "video": {"count": 9, "size": 17325267022}
}
```

### 3. 获取媒体列表

分页获取媒体项列表，支持排序、筛选和搜索。

- **Method:** `GET`
- **Path:** `/api/media`

**查询参数:**

| 参数名        | 类型    | 描述                                     |
| ------------- | ------- | ---------------------------------------- |
| `page`        | Integer | (可选, 默认: 1) 请求的页码。             |
| `pageSize`    | Integer | (可选, 默认: 20) 每页返回的媒体项数量。   |
| `sort`        | String  | (可选, 默认: `newest`) 排序顺序 (`newest` 或 `oldest`)。 |
| `type`        | String  | (可选) 按类型筛选 (`image` 或 `video`)。   |
| `favoritesOnly` | Boolean | (可选) 如果为 `true`，则只返回收藏的媒体项。 |
| `search`      | String  | (可选) 搜索词，匹配文件名、AI标题和AI标签。 |
| `folder`      | String  | (可选) 按文件夹路径精确筛选。             |

**响应 (200 OK):**
```json
{
  "total": 251,
  "page": 1,
  "pageSize": 2,
  "items": [
    {
      "uid": "1bbef39bebee0c101c03de3ceb4ecefa",
      "fileName": "20250115115455841_3YSB0471732GM3Q_30.mp4",
      "mediaCreatedAt": "2025-10-07T06:49:43.495514Z",
      "fileType": "video",
      "isFavorite": false,
      "url": "/api/original/0/02.学走路/20250115115455841_3YSB0471732GM3Q_30.mp4",
      "thumbnailUrl": "/api/thumbnails/1bbef39bebee0c101c03de3ceb4ecefa",
      "downloadUrl": "/api/media/1bbef39bebee0c101c03de3ceb4ecefa/download",
      "aiTitle": null,
      "aiTags": null,
      "mediaMetadata": {
        "width": 2560,
        "height": 1440,
        "duration": 29.115667,
        "fps": 25
      },
      "hlsPlaybackUrl": "/api/streams/1bbef39bebee0c101c03de3ceb4ecefa/master.m3u8"
    }
  ]
}
```

### 4. 获取所有文件夹列表

获取媒体库中所有唯一的文件夹路径列表。

- **Method:** `GET`
- **Path:** `/api/folders`

**响应 (200 OK):**
```json
[
  "/mnt/data/nextcloud/lianghan/files/07.Baby/11.成长记录/01.1岁/1岁生日",
  "/mnt/data/nextcloud/lianghan/files/07.Baby/11.成长记录/02.学走路"
]
```

### 5. 收藏/取消收藏媒体项

- **Method:** `POST` (收藏), `DELETE` (取消收藏)
- **Path:** `/api/media/{uid}/favorite`

**响应 (204 No Content):**
操作成功，无返回内容。

### 6. 获取缩略图

- **Method:** `GET`
- **Path:** `/api/thumbnails/{uid}`

**查询参数:**

| 参数名 | 类型   | 描述                                     |
| ------ | ------ | ---------------------------------------- |
| `size` | String | (可选, 默认: `medium`) 缩略图尺寸 (`small`, `medium`, `large`, `preview`)。 `preview` 尺寸建议用于全屏预览。 |

**响应 (200 OK):**
返回 `image/webp` 格式的图片数据。

### 7. 获取 HLS 视频流 (实时转码)

此端点用于提供 HLS (HTTP Live Streaming) 视频流。当首次请求视频的 `master.m3u8` 文件时，后端会实时将原始视频转码为 1080p 的 HLS 流，并将其缓存在临时目录中。后续对该视频的请求将直接从缓存提供，直到缓存过期被自动清理。

- **Method:** `GET`
- **Path:** `/api/streams/{uid}/{filename}`

**路径参数:**

| 参数名 | 类型 | 描述 |
| --- | --- | --- |
| `uid` | String | 视频媒体项的唯一标识符。 |
| `filename` | String | 请求的文件名，通常是 `master.m3u8` (主播放列表) 或视频切片 (如 `1080p_001.ts`)。 |

**响应:**
- **200 OK:** 成功时，返回请求的文件内容。
  - 如果是 `.m3u8` 文件，`Content-Type` 为 `application/vnd.apple.mpegurl`。
  - 如果是 `.ts` 文件，`Content-Type` 为 `video/mp2t`。
- **404 Not Found:** 如果 `uid` 无效或文件未找到。
- **500 Internal Server Error:** 如果 `ffmpeg` 转码失败。

### 8. 下载原始文件

- **Method:** `GET`
- **Path:** `/api/media/{uid}/download`

**响应 (200 OK):**
返回原始文件流，并带有 `Content-Disposition: attachment` 头，浏览器将提示下载。

### 9. 获取原始文件 (代理)

- **Method:** `GET`
- **Path:** `/api/original/{mount_index}/{relative_path}`

**响应 (200 OK):**
返回原始文件流，用于在浏览器中直接显示。

### 10. 触发媒体库扫描

- **Method:** `POST`
- **Path:** `/api/scan`

**响应:**
- **202 Accepted:** 任务已在后台启动。
- **409 Conflict:** 如果已有扫描任务在运行。

### 11. 触发AI内容分析

- **Method:** `POST`
- **Path:** `/api/ai/process`

**响应:**
- **202 Accepted:** 任务已在后台启动。
- **409 Conflict:** 如果已有AI任务在运行。

---

## 错误处理

### 标准错误响应

所有API端点在出现错误时都会返回JSON格式的错误信息：

#### 404 Not Found (通用)
```json
{
  "detail": "Not Found"
}
```

#### 404 Not Found (媒体项未找到)
```json
{
  "detail": {
    "error": {
      "code": "NOT_FOUND",
      "message": "媒体项未找到。"
    }
  }
}
```

#### 405 Method Not Allowed
```json
{
  "detail": "Method Not Allowed"
}
```

#### 409 Conflict (任务已在运行)
```json
{
  "detail": {
    "error": {
      "code": "TASK_ALREADY_RUNNING",
      "message": "扫描任务已在运行中。"
    }
  }
}
```

---

## 重要说明

1. **字段命名约定**: API 响应使用 camelCase 格式的字段名（如 `fileName`, `mediaCreatedAt`, `isFavorite` 等）。

2. **null 值处理**: 可选字段（如 `aiTitle`, `aiTags`, `mediaMetadata`）在没有数据时返回 `null`。

3. **媒体元数据**: `mediaMetadata` 字段包含媒体文件的技术信息，对于视频文件包括宽度、高度、时长和帧率。

4. **HLS 支持**: 所有视频文件都支持 HLS 流媒体播放，`hlsPlaybackUrl` 字段提供播放列表 URL。

5. **缩略图**: 所有媒体项都有对应的缩略图，支持多种尺寸。

6. **错误处理**: 所有错误都以JSON格式返回，包含详细的错误代码和消息。

7. **CORS**: API支持跨域请求，前端可以直接调用。

8. **内容类型**: 
   - JSON响应使用 `application/json`
   - 图片响应使用 `image/webp`
   - HLS播放列表使用 `application/vnd.apple.mpegurl`
   - 视频切片使用 `video/mp2t`

## 前端开发指南

### 基本使用示例

```javascript
// 获取媒体列表
const response = await fetch('/api/media?page=1&pageSize=20');
const data = await response.json();

// 显示图片
const imageItem = data.items.find(item => item.fileType === 'image');
if (imageItem) {
  const img = document.createElement('img');
  img.src = imageItem.url;
  img.alt = imageItem.fileName;
}

// 播放视频
const videoItem = data.items.find(item => item.fileType === 'video');
if (videoItem && videoItem.hlsPlaybackUrl) {
  // 使用HLS.js或其他HLS播放器
  const video = document.createElement('video');
  video.src = videoItem.hlsPlaybackUrl;
}

// 获取文件夹列表
const foldersResponse = await fetch('/api/folders');
const folders = await foldersResponse.json();
```

### 错误处理示例

```javascript
try {
  const response = await fetch('/api/media/invalid-uid/download');
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.detail);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```
