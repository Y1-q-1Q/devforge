# DevForge v2.0 API 设计规范

> RESTful API + GraphQL 混合架构

---

## 🎯 设计原则

1. **RESTful 为主** - 资源导向，标准 HTTP 方法
2. **GraphQL 为辅** - 复杂查询，减少请求次数
3. **版本控制** - URL 版本 (/api/v2/)
4. **统一格式** - JSON 响应，统一错误格式
5. **幂等性** - 安全重试，无副作用

---

## 📋 通用规范

### 基础 URL

```
https://api.devforge.io/api/v2
```

### 认证方式

```http
Authorization: Bearer <jwt_token>
```

### 请求格式

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>          # 请求追踪
```

### 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-03-22T03:08:00Z"
  }
}
```

**列表响应**:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "meta": { ... }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "meta": { ... }
}
```

---

## 🔐 认证服务 API

### 用户注册

```http
POST /api/v2/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "User Name"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "created_at": "2026-03-22T03:08:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 3600
    }
  }
}
```

### 用户登录

```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Token 刷新

```http
POST /api/v2/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 用户登出

```http
POST /api/v2/auth/logout
Authorization: Bearer <access_token>
```

### 获取当前用户

```http
GET /api/v2/auth/me
Authorization: Bearer <access_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "settings": {
      "language": "zh",
      "theme": "dark"
    },
    "created_at": "2026-03-22T03:08:00Z"
  }
}
```

---

## 📝 知识服务 API

### 笔记管理

#### 创建笔记

```http
POST /api/v2/know/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Rust 异步编程",
  "content": "## Tokio 运行时\n\nTokio 是 Rust 的异步运行时...",
  "tags": ["rust", "async", "programming"]
}
```

#### 获取笔记列表

```http
GET /api/v2/know/notes?page=1&per_page=20&sort=updated_at&order=desc
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `per_page`: 每页数量 (默认: 20, 最大: 100)
- `sort`: 排序字段 (created_at, updated_at, title)
- `order`: 排序方向 (asc, desc)
- `tag`: 标签筛选
- `q`: 关键词搜索

#### 获取单篇笔记

```http
GET /api/v2/know/notes/:id
Authorization: Bearer <token>
```

#### 更新笔记

```http
PUT /api/v2/know/notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容",
  "tags": ["rust", "async"]
}
```

#### 删除笔记

```http
DELETE /api/v2/know/notes/:id
Authorization: Bearer <token>
```

### 搜索功能

#### 全文搜索

```http
GET /api/v2/know/search?q=Rust+异步&semantic=true
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "Rust 异步编程",
        "content": "Tokio 是 Rust 的异步运行时...",
        "tags": ["rust", "async"],
        "score": 0.95,
        "highlights": {
          "title": "<mark>Rust</mark> 异步编程",
          "content": "Tokio 是 <mark>Rust</mark> 的<mark>异步</mark>运行时..."
        }
      }
    ],
    "facets": {
      "tags": [
        { "value": "rust", "count": 10 },
        { "value": "async", "count": 5 }
      ]
    }
  }
}
```

#### 语义相似笔记

```http
GET /api/v2/know/notes/:id/similar?limit=5
Authorization: Bearer <token>
```

### 标签管理

#### 获取标签列表

```http
GET /api/v2/know/tags
Authorization: Bearer <token>
```

#### 创建标签

```http
POST /api/v2/know/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "rust",
  "color": "#FF5722"
}
```

---

## 🤖 代码服务 API

### AI 代码生成

```http
POST /api/v2/code/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "context": "当前文件内容",
  "prompt": "创建一个异步函数处理 HTTP 请求",
  "language": "rust",
  "model": "codellama",
  "stream": true
}
```

**流式响应** (SSE):
```
event: message
data: {"chunk": "async fn handle_request("}

event: message
data: {"chunk": "req: Request) -> Result<Response> {"}

event: done
data: {"content": "完整代码", "tokens": 150}
```

### 代码解释

```http
POST /api/v2/code/explain
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "async fn main() { tokio::run(...).await }",
  "language": "rust",
  "detail_level": "detailed"  // brief, detailed, comprehensive
}
```

### 代码审查

```http
POST /api/v2/code/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "...",
  "language": "rust",
  "rules": ["performance", "security", "style", "best_practices"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "summary": "发现 3 个问题",
    "issues": [
      {
        "severity": "warning",
        "category": "performance",
        "line": 15,
        "message": "建议使用 Arc<str> 代替 String 减少克隆",
        "suggestion": "let name: Arc<str> = Arc::from(\"name\");"
      }
    ],
    "score": 85
  }
}
```

### 代码向量索引

```http
POST /api/v2/code/index
Authorization: Bearer <token>
Content-Type: application/json

{
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "include": ["src/**/*.rs"],
  "exclude": ["tests/**", "target/**"]
}
```

---

## ⚡ 工作流服务 API

### 工作流管理

#### 创建工作流

```http
POST /api/v2/flows/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "每日数据备份",
  "description": "自动备份数据库并上传到云存储",
  "trigger": {
    "type": "cron",
    "config": {
      "expression": "0 2 * * *"
    }
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "shell",
      "config": {
        "command": "pg_dump db_name > backup.sql"
      }
    },
    {
      "id": "node-2",
      "type": "shell",
      "config": {
        "command": "aws s3 cp backup.sql s3://bucket/backups/"
      }
    }
  ],
  "edges": [
    {
      "from": "node-1",
      "to": "node-2"
    }
  ]
}
```

#### 获取工作流列表

```http
GET /api/v2/flows/workflows?status=active&page=1
Authorization: Bearer <token>
```

#### 更新工作流

```http
PUT /api/v2/flows/workflows/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的名称",
  "trigger": { ... },
  "nodes": [ ... ]
}
```

#### 删除工作流

```http
DELETE /api/v2/flows/workflows/:id
Authorization: Bearer <token>
```

### 工作流执行

#### 手动执行

```http
POST /api/v2/flows/workflows/:id/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "variables": {
    "env": "production"
  }
}
```

#### 激活/停用

```http
POST /api/v2/flows/workflows/:id/activate
POST /api/v2/flows/workflows/:id/deactivate
Authorization: Bearer <token>
```

### 执行历史

#### 获取执行记录

```http
GET /api/v2/flows/workflows/:id/runs?page=1&status=completed
Authorization: Bearer <token>
```

#### 获取执行详情

```http
GET /api/v2/flows/runs/:run_id
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "completed",
    "started_at": "2026-03-22T02:00:00Z",
    "completed_at": "2026-03-22T02:05:00Z",
    "duration": 300,
    "nodes": [
      {
        "node_id": "node-1",
        "status": "completed",
        "started_at": "...",
        "completed_at": "...",
        "output": "备份成功: backup.sql (15MB)",
        "logs": ["..."]
      }
    ]
  }
}
```

---

## 🚀 部署服务 API

### 部署配置

#### 创建部署配置

```http
POST /api/v2/deploy/configs
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "production",
  "source": {
    "type": "git",
    "url": "https://github.com/user/repo",
    "branch": "main"
  },
  "build": {
    "dockerfile": "Dockerfile",
    "args": {
      "NODE_ENV": "production"
    }
  },
  "target": {
    "type": "kubernetes",
    "cluster": "prod-cluster",
    "namespace": "default"
  },
  "strategy": {
    "type": "rolling",
    "max_surge": "25%",
    "max_unavailable": "0"
  }
}
```

### 部署执行

#### 执行部署

```http
POST /api/v2/deploy/configs/:id/deploy
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": "v1.2.3",
  "variables": {
    "REPLICAS": "3"
  }
}
```

#### 回滚

```http
POST /api/v2/deploy/deployments/:id/rollback
Authorization: Bearer <token>
Content-Type: application/json

{
  "to_version": "v1.2.2"
}
```

### 部署状态

#### 获取部署状态

```http
GET /api/v2/deploy/deployments/:id/status
Authorization: Bearer <token>
```

#### 获取部署日志

```http
GET /api/v2/deploy/deployments/:id/logs?tail=100&follow=true
Authorization: Bearer <token>
```

**流式响应** (SSE):
```
event: log
data: {"timestamp": "...", "level": "info", "message": "Building image..."}

event: log
data: {"timestamp": "...", "level": "info", "message": "Pushing to registry..."}

event: done
data: {"status": "completed"}
```

---

## 🔌 WebSocket API

### 实时通知

```javascript
const ws = new WebSocket('wss://api.devforge.io/ws', [], {
  headers: { 'Authorization': 'Bearer <token>' }
});

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case 'workflow.started':
      console.log('工作流开始:', message.data);
      break;
    case 'workflow.completed':
      console.log('工作流完成:', message.data);
      break;
    case 'deployment.status':
      console.log('部署状态:', message.data);
      break;
  }
};
```

---

## 📊 GraphQL API

### 端点

```
POST /api/v2/graphql
```

### 查询示例

```graphql
query GetUserDashboard {
  me {
    id
    name
    notes(limit: 5) {
      id
      title
      updatedAt
    }
    workflows(limit: 5) {
      id
      name
      status
      lastRun {
        status
        completedAt
      }
    }
    stats {
      totalNotes
      totalWorkflows
      totalDeployments
    }
  }
}
```

### 变更示例

```graphql
mutation CreateNote($input: CreateNoteInput!) {
  createNote(input: $input) {
    id
    title
    content
    createdAt
  }
}

# 变量
{
  "input": {
    "title": "新笔记",
    "content": "笔记内容",
    "tags": ["tag1", "tag2"]
  }
}
```

---

## 🐛 错误码规范

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| INVALID_REQUEST | 400 | 请求格式错误 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMITED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务暂时不可用 |

---

## 📈 速率限制

| 端点 | 限制 |
|------|------|
| 认证相关 | 10次/分钟 |
| 普通 API | 1000次/分钟 |
| AI 生成 | 60次/分钟 |
| 搜索 | 120次/分钟 |

**响应头**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1647900000
```

---

**API 设计规范完成，可作为开发标准使用。**