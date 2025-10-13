# 璟聿.today 媒体服务 API 文档

## 简介

本文档提供了对 `璟聿.today` 媒体服务后端 API 的详细说明。该 API 旨在为前端应用提供媒体文件管理、访问、AI 内容分析以及统计等功能。

## 认证

当前版本的 API **无需认证**。

---

## 数据模型

### MediaItem

代表媒体库中的一个项目（图片或视频）。

| 字段名         | 类型          | 描述                               |
| -------------- | ------------- | ---------------------------------- |
| `uid`          | String        | 媒体项的唯一标识符。               |
| `name`         | String        | 文件名。                           |
| `date`         | String (ISO)  | 媒体的创建日期 (通常来自EXIF)。    |
| `type`         | String        | 媒体类型 (`image` 或 `video`)。    |
| `isFavorite`   | Boolean       | 是否已收藏。                       |
| `url`          | String        | 访问原始媒体文件的URL。            |
| `thumbnailUrl` | String        | 访问缩略图的URL (不含尺寸参数)。   |
| `downloadUrl`  | String        | 下载原始媒体文件的URL。            |
| `aiTitle`      | String        | (可选) AI 生成的标题。             |
| `aiTags`       | Array[String] | (可选) AI 生成的标签列表。         |
| `metadata`     | Object        | (可选) 包含媒体元数据的对象。      |

**示例:**
```json
{
  "uid": "a1b2c3d4e5f6",
  "name": "IMG_1234.jpg",
  "date": "2025-10-13T10:00:00+08:00",
  "type": "image",
  "isFavorite": false,
  "url": "/api/original/0/path/to/IMG_1234.jpg",
  "thumbnailUrl": "/api/thumbnails/a1b2c3d4e5f6",
  "downloadUrl": "/api/media/a1b2c3d4e5f6/download",
  "aiTitle": "夕阳下的海滩",
  "aiTags": ["海滩", "夕阳", "风景"],
  "metadata": {
    "width": 1920,
    "height": 1080,
    "cameraMake": "Apple",
    "cameraModel": "iPhone 15 Pro"
  }
}
```

---

## API 端点

### 任务 (Tasks)

#### 1. 触发媒体库扫描

在后台启动一个任务，扫描媒体库以发现新文件。

- **Method:** `POST`
- **Path:** `/api/scan`
- **Body:** None

**成功响应 (202 Accepted):**
```json
{
  "message": "媒体库扫描任务已在后台启动。"
}
```

**冲突响应 (409 Conflict):**
```json
{
  "error": {
    "code": "TASK_IN_PROGRESS",
    "message": "媒体扫描任务已在进行中。"
  }
}
```

#### 2. 触发AI内容分析

在后台启动一个任务，为尚未处理的媒体项进行AI内容分析。

- **Method:** `POST`
- **Path:** `/api/ai/process`
- **Body:** None

**成功响应 (202 Accepted):**
```json
{
  "message": "AI内容分析任务已在后台启动。"
}
```

**冲突响应 (409 Conflict):**
```json
{
  "error": {
    "code": "TASK_IN_PROGRESS",
    "message": "AI处理任务已在进行中。"
  }
}
```

#### 3. 获取后台任务状态

查询当前是否有扫描或AI处理任务正在运行。

- **Method:** `GET`
- **Path:** `/api/status`

**响应示例:**
```json
{
  "is_scanning": true,
  "is_ai_processing": false
}
```

---

### 媒体 (Media)

#### 1. 获取媒体列表

分页获取媒体项列表，支持排序、筛选和搜索。

- **Method:** `GET`
- **Path:** `/api/media`
- **查询参数:**
  - `page` (Int, optional, default: 1): 页码。
  - `pageSize` (Int, optional, default: 20): 每页数量。
  - `sort` (String, optional, default: `newest`): 排序方式 (`newest` 或 `oldest`)。
  - `type` (String, optional): 按类型筛选 (`image` 或 `video`)。
  - `favoritesOnly` (Boolean, optional, default: false): 只显示收藏项。
  - `search` (String, optional): 搜索关键词 (匹配文件名、AI标题、AI标签)。
  - `folder` (String, optional): 按文件夹路径筛选。

**响应示例 (`PaginatedMediaResponse`):**
```json
{
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "items": [
    // MediaItem 对象列表
  ]
}
```

#### 2. 下载原始媒体文件

- **Method:** `GET`
- **Path:** `/api/media/{uid}/download`

**响应:**
文件流，浏览器将提示下载。

#### 3. 收藏媒体项

- **Method:** `POST`
- **Path:** `/api/media/{uid}/favorite`
- **响应:** `204 No Content`

#### 4. 取消收藏媒体项

- **Method:** `DELETE`
- **Path:** `/api/media/{uid}/favorite`
- **响应:** `204 No Content`

#### 5. 获取原始媒体文件

安全地提供对原始媒体文件的访问。

- **Method:** `GET`
- **Path:** `/api/original/{mount_index}/{relative_path}`
- **路径参数:**
  - `mount_index` (Int): 媒体库挂载点的索引。
  - `relative_path` (String): 文件相对于挂载点的路径。
- **响应:** 原始文件内容。

---

### 缩略图 (Thumbnails)

#### 1. 获取响应式缩略图

- **Method:** `GET`
- **Path:** `/api/thumbnails/{uid}`
- **查询参数:**
  - `size` (String, optional, default: `medium`): 缩略图尺寸 (`small`, `medium`, `large`)。
- **响应:** 缩略图图片文件。

---

### 文件夹 (Folders)

#### 1. 获取所有文件夹列表

获取媒体库中所有唯一的文件夹路径列表。

- **Method:** `GET`
- **Path:** `/api/folders`

**响应示例:**
```json
[
  "/path/to/folder1",
  "/path/to/folder2"
]
```

---

### 统计 (Statistics)

#### 1. 获取媒体库统计信息

获取关于媒体库的统计数据，如文件总数和总体积。

- **Method:** `GET`
- **Path:** `/api/stats`
- **查询参数:**
  - `year` (Int, optional): 按年份筛选。
  - `month` (Int, optional): 按月份筛选 (需同时提供年份)。

**响应示例 (`StatsResponse`):**
```json
{
  "total": {
    "count": 1200,
    "size": 53687091200
  },
  "photo": {
    "count": 800,
    "size": 21474836480
  },
  "video": {
    "count": 400,
    "size": 32212254720
  }
}
```