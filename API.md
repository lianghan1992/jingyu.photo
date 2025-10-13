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
| `file_name`      | String        | 文件名。                                   |
| `media_created_at` | String (ISO)  | 媒体的创建日期 (EXIF或文件创建时间)。      |
| `file_type`      | String        | 媒体类型 (`image` 或 `video`)。            |
| `is_favorite`    | Boolean       | 是否已收藏。                               |
| `url`            | String        | 访问原始媒体文件的代理URL。                |
| `thumbnailUrl`   | String        | 访问缩略图的URL (不含尺寸参数)。           |
| `downloadUrl`    | String        | 下载原始媒体文件的URL。                    |
| `ai_title`       | String        | (可选) AI 生成的标题。                     |
| `ai_tags`        | Array[String] | (可选) AI 生成的标签列表。                 |
| `media_metadata` | Object        | (可选) 包含媒体元数据的对象 (如宽高、相机信息等)。 |

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
```http
HTTP/1.1 200 OK
content-type: application/json

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
```http
HTTP/1.1 200 OK
content-type: application/json

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
```http
HTTP/1.1 200 OK
content-type: application/json

{
  "total": 251,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "uid": "db992ebc023c7695322e87979cf46bf9",
      "file_name": "VID_20250419_184348.mp4",
      // ... 其他字段
    }
  ]
}
```

### 4. 获取所有文件夹列表

获取媒体库中所有唯一的文件夹路径列表。

- **Method:** `GET`
- **Path:** `/api/folders`

**Curl 示例:**
```bash
curl -i http://localhost:24116/api/folders
```

**响应 (200 OK):**
```http
HTTP/1.1 200 OK
content-type: application/json

[
  "/mnt/data/nextcloud/lianghan/files/07.Baby/11.成长记录/01.1岁/1岁生日",
  "/mnt/data/nextcloud/lianghan/files/07.Baby/11.成长记录/02.学走路"
]
```

### 5. 收藏/取消收藏媒体项

- **Method:** `POST` (收藏), `DELETE` (取消收藏)
- **Path:** `/api/media/{uid}/favorite`

**Curl 示例:**
```bash
# 收藏
curl -i -X POST http://localhost:24116/api/media/f07eddf891a5ea742cf18093dcc5369f/favorite

# 取消收藏
curl -i -X DELETE http://localhost:24116/api/media/f07eddf891a5ea742cf18093dcc5369f/favorite
```

**响应 (204 No Content):**
操作成功，无返回内容。

### 6. 获取缩略图

- **Method:** `GET`
- **Path:** `/api/thumbnails/{uid}`

**Curl 示例:**
```bash
curl -i http://localhost:24116/api/thumbnails/f07eddf891a5ea742cf18093dcc5369f?size=medium
```

**查询参数:**

| 参数名 | 类型   | 描述                                     |
| ------ | ------ | ---------------------------------------- |
| `size` | String | (可选, 默认: `medium`) 缩略图尺寸 (`small`, `medium`, `large`)。 |

**响应 (200 OK):**
返回 `image/webp` 格式的图片数据。

### 7. 下载原始文件

- **Method:** `GET`
- **Path:** `/api/media/{uid}/download`

**Curl 示例:**
```bash
curl -i -o downloaded_file.jpg http://localhost:24116/api/media/f07eddf891a5ea742cf18093dcc5369f/download
```

**响应 (200 OK):**
返回原始文件流，并带有 `Content-Disposition: attachment` 头，浏览器将提示下载。

### 8. 获取原始文件 (代理)

- **Method:** `GET`
- **Path:** `/api/original/{mount_index}/{relative_path}`

**Curl 示例:**
```bash
curl -i http://localhost:24116/api/original/0/2025.04.19.旋转木马/VID_20250419_184348.mp4
```

**响应 (200 OK):**
返回原始文件流，用于在浏览器中直接显示。

### 9. 触发媒体库扫描

- **Method:** `POST`
- **Path:** `/api/scan`

**Curl 示例:**
```bash
curl -i -X POST http://localhost:24116/api/scan
```

**响应:**
- **202 Accepted:** 任务已在后台启动。
- **409 Conflict:** 如果已有扫描任务在运行。

### 10. 触发AI内容分析

- **Method:** `POST`
- **Path:** `/api/ai/process`

**Curl 示例:**
```bash
curl -i -X POST http://localhost:24116/api/ai/process
```

**响应:**
- **202 Accepted:** 任务已在后台启动。
- **409 Conflict:** 如果已有AI任务在运行。
