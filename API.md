# 璟聿.today 前端 API 文档

## 简介

本文档为 `璟聿.today` 前端应用所使用的后端 API 提供了详细、真实的说明。旨在帮助开发者理解前端如何与后端进行数据交互。

## 认证

当前版本的 API **无需认证**。

---

## 数据模型

### MediaItem

此接口是前端应用中用于表示媒体项（图片或视频）的TypeScript接口。

```typescript
export interface MediaItem {
  uid: string;
  name: string;
  date: string; // ISO date string
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  downloadUrl: string;
  aiTitle: string | null;
  aiTags: string[] | null;
  isFavorite: boolean;
  metadata: (ImageMetadata | VideoMetadata) | null;
}
```

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

---

## API 端点

### 1. 获取媒体列表

分页获取媒体项列表，支持排序、筛选和搜索。

- **Method:** `GET`
- **Path:** `/api/media`
- **介绍:** 这是应用的核心功能，用于无限滚动加载媒体数据。

**Curl 示例:**
```bash
# 获取第一页，每页20个最新的图片
curl "http://localhost:24116/api/media?page=1&pageSize=20&sort=newest&type=image"
```

**传入参数 (Query Parameters):**

| 参数名          | 类型    | 是否必须 | 默认值   | 描述                                     |
| --------------- | ------- | -------- | -------- | ---------------------------------------- |
| `page`          | Integer | 否       | 1        | 请求的页码。                             |
| `pageSize`      | Integer | 否       | 20       | 每页返回的媒体项数量。                   |
| `sort`          | String  | 否       | `newest` | 排序顺序 (`newest` 或 `oldest`)。        |
| `type`          | String  | 否       | `all`    | 媒体类型 (`image` 或 `video`)。          |
| `favoritesOnly` | Boolean | 否       | `false`  | 如果为 `true`，则只返回收藏的媒体项。    |
| `search`        | String  | 否       |          | 搜索词，将匹配文件名、AI标题和AI标签。   |
| `folder`        | String  | 否       |          | 按文件夹路径精确筛选。                   |

**响应 (Response):**

- **成功 (200 OK):**
  ```json
  {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "uid": "...",
        "name": "...",
        // ... 其他 MediaItem 字段
      }
    ]
  }
  ```

- **失败 (503 Service Unavailable):**
  如果后端服务未运行，前端将捕获此错误。

### 2. 切换收藏状态

收藏或取消收藏一个媒体项。

- **Method:** `POST` (收藏) / `DELETE` (取消收藏)
- **Path:** `/api/media/{uid}/favorite`
- **介绍:** 用户点击收藏按钮时调用此接口。

**Curl 示例:**
```bash
# 收藏 UID 为 'some-uid' 的媒体项
curl -X POST http://localhost:24116/api/media/some-uid/favorite

# 取消收藏 UID 为 'some-uid' 的媒体项
curl -X DELETE http://localhost:24116/api/media/some-uid/favorite
```

**传入参数 (Path Parameters):**

| 参数名 | 类型   | 描述               |
| ------ | ------ | ------------------ |
| `uid`  | String | 要操作的媒体项的UID。 |

**响应 (Response):**

- **成功 (204 No Content):**
  表示操作成功，没有返回内容。

- **失败 (404 Not Found):**
  ```json
  {
      "error": {
          "code": "NOT_FOUND",
          "message": "媒体项未找到。"
      }
  }
  ```

### 3. 获取所有文件夹列表

获取媒体库中所有唯一的文件夹路径列表。

- **Method:** `GET`
- **Path:** `/api/folders`
- **介绍:** 用于在侧边栏显示文件夹树。

**Curl 示例:**
```bash
curl http://localhost:24116/api/folders
```

**响应 (Response):**

- **成功 (200 OK):**
  ```json
  [
    "/mnt/data/nextcloud/lianghan/files/07.Baby/11.成长记录/2025.01.01.元旦",
    "/mnt/data/nextcloud/lianghan/files/07.Baby/11.成长记录/2025.07.06.蘑菇乐园玩水"
  ]
  ```

### 4. 触发AI内容分析

在后台启动一个任务，为尚未处理的媒体项进行AI内容分析。

- **Method:** `POST`
- **Path:** `/api/ai/process`
- **介绍:** 用户可以手动触发此任务。

**Curl 示例:**
```bash
curl -X POST http://localhost:24116/api/ai/process
```

**响应 (Response):**

- **成功 (202 Accepted):**
  ```json
  {
    "message": "AI内容分析任务已在后台启动。"
  }
  ```

- **失败 (409 Conflict):**
  如果已有AI任务在运行，将返回此错误。
  ```json
  {
    "error": {
        "code": "TASK_IN_PROGRESS",
        "message": "AI处理任务已在进行中。"
    }
  }
  ```
