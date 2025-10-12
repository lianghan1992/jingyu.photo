# 璟聿.today - 后端API文档

本文档详细说明了媒体后端服务提供的所有API接口。

- **基础URL**: `http://<your_server_ip>:24116`
- **数据格式**: 所有请求和响应的主体均为 `application/json` 格式。

---

## 目录

1.  [媒体管理](#1-媒体管理)
    -   [GET /api/media](#get-apimedia)
    -   [POST /api/media/{uid}/favorite](#post-apimediauidfavorite)
    -   [DELETE /api/media/{uid}/favorite](#delete-apimediauidfavorite)
    -   [GET /api/media/{uid}/download](#get-apimediauiddownload)
2.  [数据源与分类](#2-数据源与分类)
    -   [GET /api/folders](#get-apifolders)
3.  [后台任务与自动化](#3-后台任务与自动化)
    -   [GET /api/scan/status](#get-apiscanstatus)
    -   [GET /api/ai/status](#get-apiaistatus)
4.  [静态资源](#4-静态资源)
    -   [GET /thumbnails/{uid}.jpg](#get-thumbnailsuidjpg)
    -   [GET /media_{index}/{relative_path}](#get-media_indexrelative_path)
5.  [数据模型](#5-数据模型)
    -   [MediaItem](#mediaitem)
6.  [前端集成指南](#6-前端集成指南)

---

## 1. 媒体管理

### GET /api/media

获取媒体文件列表，支持分页、排序和多种条件过滤。

- **方法**: `GET`
- **URL**: `/api/media`

**查询参数**:

| 参数 | 类型 | 默认值 | 必需 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `page` | integer | 1 | 否 | 请求的页码，从1开始。 |
| `pageSize` | integer | 20 | 否 | 每页返回的项目数量，范围1-100。 |
| `sort` | string | `newest` | 否 | 排序方式。可选值为 `newest` (最新) 或 `oldest` (最旧)。 |
| `type` | string | `null` | 否 | 按媒体类型过滤。可选值为 `image` 或 `video`。 |
| `favoritesOnly`| boolean | `false` | 否 | 设置为 `true` 时，仅返回已收藏的媒体。 |
| `search` | string | `null` | 否 | 搜索关键词，将匹配文件名和AI生成的标题。 |
| `folder` | string | `null` | 否 | 按文件夹的绝对路径进行过滤。 |

**成功响应 (200 OK)**:

```json
{
  "total": 125,
  "page": 1,
  "pageSize": 2,
  "items": [
    {
      "uid": "a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0",
      "name": "IMG_20231001.JPG",
      "date": "2023-10-01T15:30:00",
      "type": "image",
      "isFavorite": true,
      "url": "/media_0/2023/Vacation/IMG_20231001.JPG",
      "thumbnailUrl": "/thumbnails/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0.jpg",
      "aiTitle": "夕阳下的金色沙滩，海浪轻拂",
      "aiTags": ["海滩", "日落", "海洋", "自然风光", "度假"]
    },
    {
      "uid": "f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5",
      "name": "VID_20230928.MP4",
      "date": "2023-09-28T11:00:00",
      "type": "video",
      "isFavorite": false,
      "url": "/media_0/2023/Family/VID_20230928.MP4",
      "thumbnailUrl": "/thumbnails/f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5.jpg",
      "aiTitle": null,
      "aiTags": null
    }
  ]
}
```

### POST /api/media/{uid}/favorite

将指定的媒体项标记为收藏。

- **方法**: `POST`
- **URL**: `/api/media/{uid}/favorite`
- **路径参数**:
  - `uid` (string, required): 媒体项的唯一ID。

**成功响应 (204 No Content)**:

- 响应体为空。

**失败响应 (404 Not Found)**:

```json
{
  "detail": "Media item not found"
}
```

### DELETE /api/media/{uid}/favorite

取消指定媒体项的收藏状态。

- **方法**: `DELETE`
- **URL**: `/api/media/{uid}/favorite`
- **路径参数**:
  - `uid` (string, required): 媒体项的唯一ID。

**成功响应 (204 No Content)**:

- 响应体为空。

**失败响应 (404 Not Found)**:

```json
{
  "detail": "Media item not found"
}
```

### GET /api/media/{uid}/download

下载指定媒体项的原始文件。

- **方法**: `GET`
- **URL**: `/api/media/{uid}/download`
- **路径参数**:
  - `uid` (string, required): 媒体项的唯一ID。

**成功响应 (200 OK)**:

- 响应体为原始文件流。浏览器将触发文件下载。

**失败响应 (404 Not Found)**:

```json
{
  "detail": "Media item not found"
}
```

---

## 2. 数据源与分类

### GET /api/folders

获取媒体库中所有包含媒体文件的文件夹列表。

- **方法**: `GET`
- **URL**: `/api/folders`

**成功响应 (200 OK)**:

```json
[
  "/path/to/your/media/2022/Travel",
  "/path/to/your/media/2023/Family",
  "/path/to/your/media/2023/Vacation"
]
```

---

## 3. 后台任务与自动化

后端服务现在已高度自动化，会在启动时执行初始媒体库扫描和AI处理，并持续监控媒体目录的变更。

- **启动时自动化**: 服务启动时，会自动对所有配置的 `MEDIA_LIBRARY_PATH` 进行一次全面的扫描，并将新发现的媒体文件添加到数据库。随后，会自动触发对这些新媒体文件的AI分析（生成标题和标签）。
- **实时文件监控**: 服务会实时监控 `MEDIA_LIBRARY_PATH` 中的文件系统事件。当检测到新的媒体文件（或现有文件被修改并稳定后），它会立即触发对这些文件的扫描和AI处理。这确保了媒体库的及时更新。

尽管大多数任务是自动化的，但以下API仍然可用，用于手动触发或查询状态：

### POST /api/scan

手动触发一次后台媒体库扫描任务。通常不需要手动调用，因为服务会自动监控文件系统。

- **方法**: `POST`
- **URL**: `/api/scan`

**成功响应 (202 Accepted)**:

```json
{
  "message": "Media library scan initiated in the background."
}
```

**失败响应 (409 Conflict)**:

```json
{
  "detail": "A scan is already in progress."
}
```

### GET /api/scan/status

查询媒体库扫描任务的当前状态。

- **方法**: `GET`
- **URL**: `/api/scan/status`

**成功响应 (200 OK)**:

```json
{
  "is_scanning": false
}
```

### POST /api/ai/process

手动触发一次对所有未处理图片的AI分析任务。通常不需要手动调用，因为服务会自动在扫描后触发AI处理。

- **方法**: `POST`
- **URL**: `/api/ai/process`

**成功响应 (202 Accepted)**:

```json
{
  "message": "AI processing for unprocessed images initiated in the background."
}
```

**失败响应 (409 Conflict)**:

```json
{
  "detail": "An AI processing job is already in progress."
}
```

### GET /api/ai/status

查询AI分析任务的当前状态。

- **方法**: `GET`
- **URL**: `/api/ai/status`

**成功响应 (200 OK)**:

```json
{
  "is_ai_processing": false
}
```

---

## 4. 静态资源

### GET /thumbnails/{uid}.jpg

获取指定媒体项的缩略图。

- **方法**: `GET`
- **URL**: `/thumbnails/{uid}.jpg`
- **路径参数**:
  - `uid` (string, required): 媒体项的唯一ID。

**成功响应 (200 OK)**:

- 响应体为JPEG图片。

### GET /media_{index}/{relative_path}

获取原始媒体文件（用于前端预览）。

- **方法**: `GET`
- **URL**: `/media_{index}/{relative_path}`
- **路径参数**:
  - `index` (integer, required): 对应 `MEDIA_LIBRARY_PATH` 列表中路径的索引（从0开始）。
  - `relative_path` (string, required): 媒体文件相对于其所属媒体库根目录的路径，例如 `2023/Vacation/IMG_20231001.JPG`。

**成功响应 (200 OK)**:

- 响应体为原始图片或视频文件。

---

## 5. 数据模型

### MediaItem

`GET /api/media` 接口返回的媒体项对象结构。

| 字段 | 类型 | 描述 |
| :--- | :--- | :--- |
| `uid` | string | 媒体项的唯一标识符。 |
| `name` | string | 原始文件名。 |
| `date` | string | 媒体的拍摄日期 (ISO 8601 格式)。 |
| `type` | string | 媒体类型，`"image"` 或 `"video"`。 |
| `isFavorite` | boolean | 是否为收藏项。 |
| `url` | string | 用于前端预览的原始文件URL。注意：URL现在包含一个索引，例如 `/media_0/path/to/file.jpg`。 |
| `thumbnailUrl` | string | 缩略图的URL。 |
| `aiTitle` | string (nullable) | AI生成的标题。 |
| `aiTags` | array[string] (nullable) | AI生成的标签列表。 |

---

## 6. 前端集成指南

由于后端现在实现了自动化的媒体扫描和实时文件监控，前端应用可以简化其与媒体数据同步的逻辑。

**获取最新媒体数据**:

前端无需手动触发扫描。当用户上传新文件到监控的媒体目录后，后端会自动检测、处理（包括生成缩略图和AI分析），并将新媒体项添加到数据库。

为了在前端展示这些新发现的媒体，您只需定期（例如，每隔几秒或在用户刷新页面时）调用 `GET /api/media` 接口。后端将返回所有已处理的媒体项，包括最新添加的。

**媒体文件URL结构**:

请注意，由于后端现在支持多个 `MEDIA_LIBRARY_PATH`，原始媒体文件的URL结构已更新。`MediaItem` 对象中的 `url` 字段将包含一个索引，例如 `/media_0/path/to/file.jpg`。这个索引对应于 `.env` 文件中 `MEDIA_LIBRARY_PATH` 变量里配置的路径顺序（从0开始）。前端在构建媒体资源的完整URL时，应直接使用 `MediaItem.url` 字段的值。

**缩略图URL**:

缩略图的URL结构保持不变，仍为 `/thumbnails/{uid}.jpg`。

**实时更新**:

如果前端需要更实时的更新体验，可以考虑实现 WebSocket 连接来接收后端关于新媒体项的通知。但这超出了当前API的范围，需要后端额外实现WebSocket接口。对于大多数用例，定期轮询 `GET /api/media` 接口足以提供良好的用户体验。