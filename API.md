# 璟聿.today - 后端API文档 v2.1

**版本**: 2.1
**最后更新**: 2025-10-13

## 1. 核心概念

### 1.1. 核心工作流

本API的核心是将物理文件系统中的媒体文件，转化为一个带有丰富元数据、可供前端消费的结构化信息库。整个过程高度自动化，其工作流如下：

1.  **文件监控**: `watchdog` 服务在后台实时监控 `.env` 中配置的 `MEDIA_LIBRARY_PATH` 目录。
2.  **变更检测**: 当一个新文件被添加（或修改完成）时，服务会获取该文件的路径。
3.  **扫描与入库**: 程序对新文件进行处理：
    *   生成一个基于文件路径的唯一ID (`uid`)。
    *   检查数据库，确认该 `uid` 是否已存在，避免重复处理。
    *   提取文件的基本信息（文件名、路径、类型）和元数据（EXIF、视频时长等）。
    *   生成三种尺寸的 `WebP` 格式缩略图。
    *   将包含所有上述信息的新 `MediaItem` 记录存入数据库。
4.  **AI内容分析**: 扫描完成后，系统会自动触发AI处理任务，为所有新入库且未被分析过的图片，调用智谱AI接口生成标题和标签，并更新到对应的 `MediaItem` 记录中。
5.  **API就绪**: 一旦数据入库，前端即可通过 `GET /api/media` 接口查询到该媒体项。

### 1.2. 标准化错误响应

所有API在遇到客户端或服务器错误时，都会返回一个标准化的JSON错误对象。前端应捕获HTTP状态码并解析响应体以获取详细错误信息。

**HTTP状态码**: 

- `400 Bad Request`: 请求参数无效（例如，类型错误、超出范围）。
- `404 Not Found`: 请求的资源不存在。
- `409 Conflict`: 请求与服务器当前状态冲突（例如，尝试启动一个已在运行的任务）。
- `500 Internal Server Error`: 服务器内部发生未知错误。

**标准错误结构**:

```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "对错误的详细、可读的描述。"
  }
}
```

---

## 2. 数据模型

### 2.1. MediaItem 对象

这是API返回的最核心的数据对象，代表一个媒体文件。

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
    "cameraModel": "iPhone 13 Pro",
    "focalLength": "5.7mm",
    "aperture": "f/1.5",
    "shutterSpeed": "1/120",
    "iso": 50
  }
}
```

**字段详解**:

| 字段 | 类型 | 是否可为空 | 描述 |
| :--- | :--- | :--- | :--- |
| `uid` | string | 否 | 媒体项的唯一标识符，由文件路径MD5生成。 |
| `name` | string | 否 | 原始文件名。 |
| `date` | string | 否 | 媒体的拍摄日期 (ISO 8601 格式)。优先使用EXIF中的拍摄日期，否则回退到文件系统的创建或修改日期。 |
| `type` | string | 否 | 媒体类型, `"image"` 或 `"video"`。 |
| `isFavorite` | boolean | 否 | `true` 表示已收藏。 |
| `url` | string | 否 | 用于在前端直接预览的原始文件URL。这是一个相对路径，前端应将其与服务器地址拼接。 |
| `thumbnailUrl` | string | 否 | **基础**缩略图URL。前端应根据需要附加 `?size=small|medium|large` 参数来获取具体尺寸的缩略图。 |
| `downloadUrl` | string | 否 | 用于下载原始文件的完整API路径。 |
| `aiTitle` | string | 是 | AI生成的单句中文标题。如果尚未处理或处理失败，则为 `null`。 |
| `aiTags` | array[string] | 是 | AI生成的中文标签列表。如果尚未处理或处理失败，则为 `null`。 |
| `metadata` | object | 否 | 媒体元数据，其结构取决于 `type` 字段。 |

### 2.2. Metadata (元数据) 对象

**当 `type` 为 `"image"` 时**:

| 字段 | 类型 | 是否可为空 | 描述 |
| :--- | :--- | :--- | :--- |
| `width` | integer | 否 | 宽度（像素）。 |
| `height` | integer | 否 | 高度（像素）。 |
| `cameraMake` | string | 是 | 相机制造商 (e.g., `"Apple"`)。 |
| `cameraModel` | string | 是 | 相机型号 (e.g., `"iPhone 13 Pro"`)。 |
| `focalLength` | string | 是 | 焦距 (e.g., `"5.7mm"`)。 |
| `aperture` | string | 是 | 光圈 (e.g., `"f/1.5"`)。 |
| `shutterSpeed` | string | 是 | 快门速度 (e.g., `"1/120"`)。 |
| `iso` | integer | 是 | ISO感光度。 |

**当 `type` 为 `"video"` 时**:

| 字段 | 类型 | 是否可为空 | 描述 |
| :--- | :--- | :--- | :--- |
| `width` | integer | 否 | 宽度（像素）。 |
| `height` | integer | 否 | 高度（像素）。 |
| `duration` | float | 否 | 时长（秒）。 |
| `fps` | integer | 是 | 帧率。 |

---

## 3. API 端点详解

### 3.1. 媒体 (Media)

#### **获取媒体列表**

获取媒体文件列表，支持强大的分页、排序和过滤功能。

- `GET /api/media`

**查询参数**:

| 参数 | 类型 | 默认值 | 约束 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `page` | integer | 1 | `> 0` | 请求的页码。 |
| `pageSize` | integer | 20 | `1-100` | 每页返回的项目数。 |
| `sort` | string | `newest` | `"newest"`, `"oldest"` | 按媒体拍摄日期排序。 |
| `type` | string | `null` | `"image"`, `"video"` | 按媒体类型过滤。 |
| `favoritesOnly`| boolean | `false` | `true`, `false` | `true`时仅返回收藏项。 |
| `search` | string | `null` | | 关键词，将模糊匹配文件名、AI标题和AI标签。 |
| `folder` | string | `null` | | 文件夹的绝对路径，用于筛选特定目录下的媒体。 |

**CURL 示例**:

```bash
# 获取第2页，每页10个，仅包含被收藏的图片
curl -X GET "http://localhost:24116/api/media?page=2&pageSize=10&type=image&favoritesOnly=true"
```

**成功响应 (`200 OK`)**:

```json
{
  "total": 150,
  "page": 2,
  "pageSize": 10,
  "items": [ /* MediaItem 对象数组 */ ]
}
```

**失败响应 (`400 Bad Request`)**:

```json
// 请求: /api/media?page=0
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Query parameter 'page' must be greater than 0."
  }
}
```

#### **获取响应式缩略图**

获取指定媒体项的特定尺寸的WebP格式缩略图。

- `GET /api/thumbnails/{uid}`

**CURL 示例**:

```bash
# 获取UID为 ...d9e0 的小尺寸缩略图，并保存为 a.webp
curl -X GET "http://localhost:24116/api/thumbnails/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0?size=small" -o a.webp
```

**成功响应 (`200 OK`)**: 响应体为 `image/webp` 格式的二进制图片数据。

**失败响应 (`404 Not Found`)**:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Thumbnail not found."
  }
}
```

#### **收藏与取消收藏**

- **收藏**: `POST /api/media/{uid}/favorite`
- **取消收藏**: `DELETE /api/media/{uid}/favorite`

**CURL 示例**:

```bash
curl -X POST http://localhost:24116/api/media/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0/favorite
```

**成功响应 (`204 No Content`)**: 响应体为空，表示操作成功。

**失败响应 (`404 Not Found`)**: 如果 `uid` 不存在，返回标准404错误。

#### **下载原始文件**

- `GET /api/media/{uid}/download`

**CURL 示例**:

```bash
curl -X GET http://localhost:24116/api/media/a8c3f1b7e4d9a2c1b3e4f5a6b7c8d9e0/download --output original_file.jpg
```

**成功响应 (`200 OK`)**: 响应体为原始文件流 (`application/octet-stream`)，浏览器将触发下载。

### 3.2. 分类 (Taxonomy)

#### **获取所有文件夹**

- `GET /api/folders`

**CURL 示例**:

```bash
curl -X GET http://localhost:24116/api/folders
```

**成功响应 (`200 OK`)**: 返回一个包含所有文件夹绝对路径的JSON字符串数组。

```json
[
  "/media/photos/2023/Vacation",
  "/media/photos/2024/Family"
]
```

### 3.3. 后台任务 (Tasks)

#### **触发媒体扫描**

- `POST /api/scan`

**成功响应 (`202 Accepted`)**: `{"message": "Media library scan initiated."}`

**失败响应 (`409 Conflict`)**: `{"error": {"code": "TASK_IN_PROGRESS", "message": "A media scan is already in progress."}}`

#### **触发AI处理**

- `POST /api/ai/process`

**成功响应 (`202- Accepted`)**: `{"message": "AI processing initiated."}`

**失败响应 (`409 Conflict`)**: `{"error": {"code": "TASK_IN_PROGRESS", "message": "An AI processing job is already in progress."}}`

#### **获取任务状态**

- `GET /api/status`

**成功响应 (`200 OK`)**:

```json
{
  "is_scanning": false,
  "is_ai_processing": true
}
```