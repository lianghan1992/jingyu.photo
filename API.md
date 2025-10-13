# 璟聿.today 后端 API 文档

## 简介

本文档为 `璟聿.today` 后端服务提供了详细、真实的API说明。所有接口都经过了实际测试，旨在帮助开发者准确地理解和使用这些API。

## 认证

当前版本的 API **无需认证**。

---

## 数据模型

### MediaItem

代表媒体库中的一个项目（图片或视频）。

| 字段名           | 类型          | 描述                                       |
| ---------------- | ------------- | ------------------------------------------ |
| `uid`            | String        | 媒体项的唯一标识符 (MD5 of file_path)。    |
| `name`           | String        | 文件名。                                   |
| `date`           | String (ISO)  | 媒体的创建日期 (EXIF或文件创建时间)。      |
| `type`           | String        | 媒体类型 (`image` 或 `video`)。            |
| `isFavorite`     | Boolean       | 是否已收藏。                               |
| `url`            | String        | 访问原始媒体文件的代理URL。                |
| `thumbnailUrl`   | String        | 访问缩略图的URL (不含尺寸参数)。           |
| `downloadUrl`    | String        | 下载原始媒体文件的URL。                    |
| `hlsPlaybackUrl` | String \| null | (仅对视频) HLS 播放列表的 URL。如果为 `null`，则不支持 HLS。 |
| `aiTitle`        | String \| null | (可选) AI 生成的标题。                     |
| `aiTags`         | Array[String] | (可选) AI 生成的标签列表。                 |
| `metadata`       | Object        | (可选) 包含媒体元数据的对象 (如宽高、相机信息等)。 |

---

## API 端点

### 1. 获取后台任务状态

查询当前是否有扫描或AI处理任务正在运行。

- **Method:** `GET`
- **Path:** `/api/status`

**Curl 示例:**
```bash
curl -i http://localhost:24116/api/status
```

**响应 (200 OK):**
```json
{
  "is_scanning": false,
  "is_ai_processing": false
}
```

### 2. 获取媒体库统计信息

获取关于媒体库的统计数据，如文件总数和总体积。

- **Method:** `GET`
- **Path:** `/api/stats`

**Curl 示例:**
```bash
curl -i http://localhost:24116/api/stats
```

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

**Curl 示例:**
```bash
# 获取第一页，每页20个最新的图片
curl -i "http://localhost:24116/api/media?pageSize=20&sort=newest&type=image"
```

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
  "pageSize": 20,
  "items": [
    {
      "uid": "db992ebc023c7695322e87979cf46bf9",
      "name": "VID_20250419_184348.mp4",
      "hlsPlaybackUrl": "/api/streams/db992ebc023c7695322e87979cf46bf9/master.m3u8",
      // ... 其他字段
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

**Curl 示例:**
```bash
# 请求主播放列表
curl -i http://localhost:24116/api/streams/db992ebc023c7695322e87979cf46bf9/master.m3u8
```

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