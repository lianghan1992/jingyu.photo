# 璟聿.today - 后端API文档 v2.3

**版本**: 2.3
**最后更新**: 2025-10-13

## 1. 介绍

欢迎使用 `璟聿.today` 后端API。本文档为前端开发者提供与API交互所需的所有信息。API遵循RESTful原则，使用标准的HTTP方法和状态码，所有数据交换均采用JSON格式。

- **基础URL**: `http://<your_server_ip>:24116/api`
- **认证**: 当前所有端点均为开放访问，无需认证。

---

## 2. 核心工作流: 从文件到API

理解数据如何被处理是有效使用API的关键。以下是一个媒体文件从磁盘到API响应的完整生命周期：

1.  **文件监控**: 服务启动后，一个后台进程 (`watchdog`) 会持续监控您在 `.env` 文件中 `MEDIA_LIBRARY_PATH` 指定的目录。
2.  **事件触发**: 当您向该目录中添加一个新文件时，监控器会捕捉到“文件创建”事件。
3.  **扫描入库**: 程序对新文件执行扫描：
    *   为文件路径生成一个唯一的MD5哈希作为 `uid`。
    *   查询数据库，若 `uid` 已存在则跳过，防止重复处理。
    *   获取文件大小 (`file_size`)，若为空文件则跳过。
    *   提取媒体元数据（EXIF/视频信息）和创建时间。
    *   调用 `Pillow` 或 `FFmpeg` 生成三种尺寸 (`small`, `medium`, `large`) 的WebP格式缩略图。
    *   将包含所有上述信息的新记录（`MediaItem`）插入到PostgreSQL数据库中。
4.  **AI分析**: 在扫描任务的最后阶段，会自动触发一个并行的AI分析任务。该任务会查找所有尚未被AI处理过的图片，调用智谱AI接口为其生成标题和标签，然后将结果更新回数据库。
5.  **API就绪**: 一旦 `MediaItem` 记录被存入数据库，它就可以立即通过API被查询到。即使此时AI分析尚未完成（`aiTitle` 和 `aiTags` 可能为 `null`），前端也可以先展示图片和基本信息。

---

## 3. 数据模型详解

### 3.1. MediaItem 对象

API返回的最核心的数据对象，代表一个媒体文件。

**示例JSON**
```json
{
  "uid": "a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0",
  "name": "IMG_20231001.JPG",
  "date": "2023-10-01T15:30:00",
  "type": "image",
  "isFavorite": true,
  "url": "/media_0/2023/Vacation/IMG_20231001.JPG",
  "thumbnailUrl": "/api/thumbnails/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0",
  "downloadUrl": "/api/media/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0/download",
  "aiTitle": "夕阳下的金色沙滩，海浪轻拂",
  "aiTags": ["海滩", "日落", "海洋", "自然", "风景"],
  "metadata": {
    "width": 4032,
    "height": 3024,
    "cameraMake": "Apple",
    "cameraModel": "iPhone 13 Pro"
  }
}
```

**字段详解**

| 字段 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| `uid` | `string` | 媒体项的唯一标识符。 |
| `name` | `string` | 原始文件名。 |
| `date` | `string` (ISO 8601) | 媒体的拍摄日期。 |
| `type` | `string` | 媒体类型, `"image"` 或 `"video"`。 |
| `isFavorite` | `boolean` | `true` 表示已收藏。 |
| `url` | `string` | 用于前端预览的原始文件URL。 |
| `thumbnailUrl` | `string` | **基础**缩略图URL。前端应附加 `?size=` 参数。 |
| `downloadUrl` | `string` | 用于下载原始文件的API路径。 |
| `aiTitle` | `string` or `null` | AI生成的单句中文标题。若处理失败，会显示`[AI处理失败: ...]`等错误信息。 |
| `aiTags` | `array[string]` or `null` | AI生成的中文标签列表。 |
| `metadata` | `object` | 媒体元数据，见下文。 |

### 3.2. StatsResponse 对象

`GET /api/stats` 接口的响应体。

**示例JSON**
```json
{
  "total": {
    "count": 58,
    "size": 278394251
  },
  "photo": {
    "count": 45,
    "size": 198349201
  },
  "video": {
    "count": 13,
    "size": 80045050
  }
}
```

**字段详解**

| 字段 | 数据类型 | 描述 |
| :--- | :--- | :--- |
| `total.count` | `integer` | 媒体文件总数。 |
| `total.size` | `integer` | 媒体文件总体积 (bytes)。 |
| `photo.count` | `integer` | 照片总数。 |
| `photo.size` | `integer` | 照片总体积 (bytes)。 |
| `video.count` | `integer` | 视频总数。 |
| `video.size` | `integer` | 视频总体积 (bytes)。 |

---

## 4. API 端点详解

### 4.1. `GET /api/media`

**功能**: 获取媒体文件列表，支持分页、排序和多种条件过滤。

**请求**
`GET http://localhost:24116/api/media`

**查询参数**

| 参数 | 类型 | 必需? | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | 否 | `1` | 请求的页码，必须是 `> 0` 的整数。 |
| `pageSize` | `integer` | 否 | `20` | 每页返回的项目数，范围 `1-100`。 |
| `sort` | `string` | 否 | `newest` | 排序方式。`newest` (最新) 或 `oldest` (最旧)。 |
| `type` | `string` | 否 | `null` | 按媒体类型过滤。`image` 或 `video`。 |
| `favoritesOnly`| `boolean` | 否 | `false` | `true`时仅返回收藏项。 |
| `search` | `string` | 否 | `null` | 搜索关键词，将匹配文件名、AI标题和AI标签。 |
| `folder` | `string` | 否 | `null` | 按文件夹的绝对路径进行过滤。 |

**响应**
- **`200 OK`**: 请求成功。
  ```json
  {
    "total": 1250,         // (integer) 满足当前过滤条件的总项目数
    "page": 1,            // (integer) 当前页码
    "pageSize": 10,         // (integer) 每页的项目数
    "items": [            // (array) MediaItem 对象数组
      { /* ... MediaItem ... */ }
    ]
  }
  ```
- **`400 Bad Request`**: 请求参数无效。
  ```json
  {
    "error": {
      "code": "INVALID_PARAMETER",
      "message": "请求参数无效。",
      "details": [ /* pydantic error details */ ]
    }
  }
  ```

**CURL示例**
```bash
curl -X GET "http://localhost:24116/api/media?pageSize=5&type=video"
```

### 4.2. `GET /api/stats`

**功能**: 提供关于媒体库构成的详细统计数据，支持按时间筛选。

**请求**
`GET http://localhost:24116/api/stats`

**查询参数**

| 参数 | 类型 | 必需? | 描述 |
| :--- | :--- | :--- | :--- |
| `year` | `integer` | 否 | 按年份筛选，例如 `2024`。 |
| `month`| `integer` | 否 | 按月份筛选，例如 `5`。需与 `year` 参数一同使用。 |

**响应**
- **`200 OK`**: 请求成功。
  ```json
  {
    "total": { "count": 58, "size": 278394251 },
    "photo": { "count": 45, "size": 198349201 },
    "video": { "count": 13, "size": 80045050 }
  }
  ```

**CURL示例**
```bash
curl -X GET "http://localhost:24116/api/stats?year=2024"
```

### 4.3. `GET /api/thumbnails/{uid}`

**功能**: 获取指定媒体项的特定尺寸的WebP格式缩略图。

**请求**
`GET http://localhost:24116/api/thumbnails/{uid}`

**查询参数**

| 参数 | 类型 | 必需? | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `size` | `string` | 否 | `medium` | 缩略图尺寸。`small`, `medium`, `large`。 |

**响应**
- **`200 OK`**: `image/webp` 格式的二进制图片数据。
- **`404 Not Found`**: 如果 `uid` 或对应的缩略图文件不存在。
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "缩略图未找到。"
    }
  }
  ```

**CURL示例**
```bash
curl -X GET "http://localhost:24116/api/thumbnails/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0?size=large" -o large_thumb.webp
```

### 4.4. 其他端点

| 功能 | 端点 | 方法 | 描述 |
| :--- | :--- | :--- | :--- |
| 收藏媒体项 | `/api/media/{uid}/favorite` | `POST` | 将指定媒体项标记为收藏。成功返回 `204 No Content`。 |
| 取消收藏 | `/api/media/{uid}/favorite` | `DELETE`| 取消指定媒体项的收藏状态。成功返回 `204 No Content`。 |
| 下载原始文件 | `/api/media/{uid}/download` | `GET` | 下载原始媒体文件。 |
| 获取所有文件夹 | `/api/folders` | `GET` | 获取一个包含所有媒体文件夹路径的列表。 |
| 获取任务状态 | `/api/status` | `GET` | 查询后台扫描和AI任务的当前运行状态。 |
| 手动触发扫描 | `/api/scan` | `POST` | 手动启动一次全量扫描任务。 |
| 手动触发AI处理| `/api/ai/process` | `POST` | 手动启动一次AI分析任务。 |