# DevForge v2.0 架构设计文档

> 基于 Rust + 现代技术栈的完整重构

---

## 🎯 设计目标

1. **极致性能** - Rust 核心，毫秒级响应
2. **水平扩展** - 分布式架构，支持百万用户
3. **数据安全** - 端到端加密，隐私优先
4. **开发效率** - 统一技术栈，快速迭代
5. **长期维护** - 工业级代码，10年演进

---

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DevForge v2.0                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        客户端层                                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │   │
│  │  │   Desktop   │ │    Web      │ │    CLI      │ │  Mobile  │  │   │
│  │  │   (Tauri)   │ │   (React)   │ │   (Rust)    │ │(Future)  │  │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────┬─────┘  │   │
│  │         └─────────────────┴─────────────────┴───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API 网关层                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                Traefik / Envoy                           │   │   │
│  │  │  - 负载均衡  - SSL终止  - 限流熔断  - 灰度发布           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        服务层 (Rust)                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │   │
│  │  │   Auth   │ │  Know    │ │  Code    │ │  Flow    │ │Deploy│  │   │
│  │  │  Service │ │ Service  │ │ Service  │ │ Service  │ │Service│  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘  │   │
│  │       └─────────────┴─────────────┴─────────────┴──────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        数据层                                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │   │
│  │  │PostgreSQL│ │  Redis   │ │Meilisearch│ │  Qdrant  │ │MinIO │  │   │
│  │  │ (主数据) │ │  (缓存)  │ │  (搜索)  │ │(向量)   │ │(对象)│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        基础设施                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │   │
│  │  │Temporal  │ │ Prometheus│ │  Grafana │ │   ELK    │ │Jaeger│  │   │
│  │  │(工作流)  │ │ (监控)   │ │ (可视化) │ │ (日志)  │ │(追踪)│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 核心服务设计

### 1. 认证服务 (Auth Service)

**职责**: 用户认证、授权、会话管理

**技术栈**:
- Rust + Actix-web
- JWT + Refresh Token
- OAuth2 / OIDC
- RBAC 权限模型

**API 设计**:
```rust
// 用户注册
POST /api/v2/auth/register
{
  "email": "user@example.com",
  "password": "***",
  "name": "User Name"
}

// 用户登录
POST /api/v2/auth/login
{
  "email": "user@example.com",
  "password": "***"
}

// Token 刷新
POST /api/v2/auth/refresh
{
  "refresh_token": "***"
}

// 登出
POST /api/v2/auth/logout
```

**数据模型**:
```rust
struct User {
    id: Uuid,
    email: String,
    name: String,
    password_hash: String,
    role: Role,           // Admin / User
    status: Status,       // Active / Inactive
    created_at: DateTime,
    updated_at: DateTime,
}

struct Session {
    id: Uuid,
    user_id: Uuid,
    access_token: String,
    refresh_token: String,
    expires_at: DateTime,
    device_info: DeviceInfo,
}
```

---

### 2. 知识服务 (Know Service)

**职责**: 笔记管理、全文搜索、知识图谱

**技术栈**:
- Rust + Actix-web
- PostgreSQL (主存储)
- Meilisearch (全文搜索)
- Qdrant (语义搜索)

**核心功能**:
```rust
// 笔记 CRUD
struct Note {
    id: Uuid,
    user_id: Uuid,
    title: String,
    content: String,      // Markdown
    tags: Vec<String>,
    vector: Vec<f32>,     // Embedding
    version: i32,         // 版本控制
    created_at: DateTime,
    updated_at: DateTime,
}

// 全文搜索
POST /api/v2/know/search
{
  "query": "Rust 异步",
  "filters": {
    "tags": ["programming"],
    "date_range": ["2024-01-01", "2024-12-31"]
  },
  "semantic": true      // 语义搜索
}

// 语义相似笔记
GET /api/v2/know/notes/:id/similar
```

**搜索架构**:
```
用户查询
    │
    ▼
┌─────────────────┐
│  查询解析器      │
│  - 分词         │
│  - 意图识别     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│关键词  │ │语义   │
│搜索    │ │搜索   │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Meili  │ │Qdrant │
│search │ │vector │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│  结果融合排序    │
│  - BM25分数    │
│  - 向量相似度   │
│  - 个性化权重  │
└─────────────────┘
```

---

### 3. 代码服务 (Code Service)

**职责**: AI编程辅助、代码分析、智能补全

**技术栈**:
- Rust + Actix-web
- Local LLM (Ollama)
- Vector DB (Qdrant)
- Tree-sitter (代码解析)

**核心功能**:
```rust
// AI代码生成
POST /api/v2/code/generate
{
  "context": "当前文件内容",
  "prompt": "创建一个异步函数",
  "language": "rust",
  "model": "codellama"
}

// 代码解释
POST /api/v2/code/explain
{
  "code": "fn main() { println!(\"Hello\"); }",
  "language": "rust"
}

// 代码审查
POST /api/v2/code/review
{
  "code": "...",
  "language": "rust",
  "rules": ["performance", "security", "style"]
}

// 代码向量索引
POST /api/v2/code/index
{
  "repository": "https://github.com/user/repo",
  "branch": "main"
}
```

**RAG架构**:
```
用户查询
    │
    ▼
┌─────────────────┐
│  代码上下文收集  │
│  - 当前文件     │
│  - 相关文件     │
│  - 项目结构     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  向量检索        │
│  - 相似代码片段 │
│  - 相关文档     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prompt构建     │
│  - System prompt│
│  - Context      │
│  - User query   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Local LLM      │
│  - CodeLlama    │
│  - Streaming    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  后处理          │
│  - 代码格式化   │
│  - 语法检查     │
└─────────────────┘
```

---

### 4. 工作流服务 (Flow Service)

**职责**: 工作流编排、定时任务、事件驱动

**技术栈**:
- Rust + Actix-web
- Temporal (工作流引擎)
- PostgreSQL (状态存储)
- Redis (消息队列)

**核心功能**:
```rust
// 工作流定义
struct Workflow {
    id: Uuid,
    user_id: Uuid,
    name: String,
    definition: WorkflowDefinition,
    trigger: Trigger,
    status: WorkflowStatus,
}

struct WorkflowDefinition {
    nodes: Vec<Node>,
    edges: Vec<Edge>,
    variables: HashMap<String, Value>,
}

// 触发器类型
enum Trigger {
    Manual,
    Cron { expression: String },
    Webhook { endpoint: String, secret: String },
    Event { source: String, event_type: String },
}

// 执行API
POST /api/v2/flows/:id/execute        // 手动执行
POST /api/v2/flows/:id/schedule       // 定时调度
POST /api/v2/flows/:id/webhook        // Webhook触发
GET  /api/v2/flows/:id/runs           // 执行历史
GET  /api/v2/flows/:id/runs/:run_id   // 执行详情
```

**Temporal集成**:
```rust
// Workflow实现
#[workflow]
async fn devforge_workflow(ctx: WorkflowContext, def: WorkflowDefinition) -> Result<()> {
    for node in def.nodes {
        match node.type_ {
            NodeType::Shell => execute_shell(node.config).await?,
            NodeType::Http => execute_http(node.config).await?,
            NodeType::Delay => sleep(node.config.duration).await,
            NodeType::Condition => {
                if evaluate_condition(node.config).await? {
                    continue;
                }
            }
        }
    }
    Ok(())
}

// Activity实现
#[activity]
async fn execute_shell(config: ShellConfig) -> Result<ShellOutput> {
    // 执行shell命令
}
```

---

### 5. 部署服务 (Deploy Service)

**职责**: 应用部署、环境管理、发布编排

**技术栈**:
- Rust + Actix-web
- Kubernetes Operator
- GitOps (ArgoCD)
- Helm

**核心功能**:
```rust
// 部署配置
struct Deployment {
    id: Uuid,
    user_id: Uuid,
    name: String,
    source: Source,           // Git / Docker / Local
    target: Target,           // K8s / Docker / VM
    strategy: Strategy,       // Rolling / BlueGreen / Canary
    environments: Vec<Environment>,
}

// 部署API
POST /api/v2/deploy/:id/deploy      // 执行部署
POST /api/v2/deploy/:id/rollback    // 回滚
GET  /api/v2/deploy/:id/status      // 部署状态
GET  /api/v2/deploy/:id/logs        // 部署日志

// GitOps集成
POST /api/v2/deploy/gitops/sync     // 同步Git状态
POST /api/v2/deploy/gitops/drift    // 检测配置漂移
```

**部署策略**:
```
┌─────────────────────────────────────────────────────────┐
│                    部署策略                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Rolling Update (滚动更新)                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│  │ v1: 100%│ -> │v1: 75%  │ -> │v1: 0%   │            │
│  │ v2: 0%  │    │v2: 25%  │    │v2: 100% │            │
│  └─────────┘    └─────────┘    └─────────┘            │
│                                                         │
│  Blue/Green (蓝绿部署)                                  │
│  ┌─────────┐    ┌─────────┐                           │
│  │ Blue    │    │ Green   │                           │
│  │ (live)  │ -> │ (live)  │                           │
│  │ v1      │    │ v2      │                           │
│  └─────────┘    └─────────┘                           │
│                                                         │
│  Canary (金丝雀)                                        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│  │ v1: 100%│ -> │v1: 95%  │ -> │v1: 0%   │            │
│  │ v2: 0%  │    │v2: 5%   │    │v2: 100% │            │
│  └─────────┘    └─────────┘    └─────────┘            │
│       ↑              ↑              ↑                  │
│    监控指标      自动判断       全量发布                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ 数据模型设计

### 用户域

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会话表
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 知识域

```sql
-- 笔记表
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    vector_id VARCHAR(100),  -- Qdrant ID
    version INTEGER DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 全文搜索索引
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('chinese', title || ' ' || content));

-- 标签表
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7),
    UNIQUE(user_id, name)
);
```

### 工作流域

```sql
-- 工作流表
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,  -- 工作流定义
    trigger_type VARCHAR(20) NOT NULL,
    trigger_config JSONB,
    status VARCHAR(20) DEFAULT 'inactive',
    temporal_workflow_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作流执行记录
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,  -- pending / running / completed / failed
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    logs JSONB DEFAULT '[]',
    error_message TEXT
);
```

---

## 🔐 安全设计

### 认证授权

```rust
// JWT Token 结构
struct Claims {
    sub: Uuid,           // 用户ID
    email: String,
    role: Role,
    iat: i64,            // 签发时间
    exp: i64,            // 过期时间
}

// 中间件
async fn auth_middleware(req: ServiceRequest, credentials: BearerAuth) -> Result<ServiceRequest, Error> {
    let token = credentials.token();
    let claims = validate_jwt(token)?;
    
    // 检查Token黑名单
    if is_token_revoked(claims.sub, token).await? {
        return Err(Error::Unauthorized);
    }
    
    req.extensions_mut().insert(claims);
    Ok(req)
}
```

### 数据加密

```rust
// 敏感字段加密
#[derive(Debug)]
struct EncryptedField {
    ciphertext: Vec<u8>,
    nonce: Vec<u8>,
}

impl EncryptedField {
    fn encrypt(plaintext: &str, key: &Key) -> Result<Self> {
        let cipher = Aes256Gcm::new(key);
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = cipher.encrypt(&nonce, plaintext.as_bytes())?;
        
        Ok(Self {
            ciphertext: ciphertext.to_vec(),
            nonce: nonce.to_vec(),
        })
    }
    
    fn decrypt(&self, key: &Key) -> Result<String> {
        let cipher = Aes256Gcm::new(key);
        let plaintext = cipher.decrypt(&self.nonce.into(), &*self.ciphertext)?;
        Ok(String::from_utf8(plaintext)?)
    }
}
```

---

## 📊 监控设计

### 指标收集

```rust
// Prometheus指标
lazy_static! {
    static ref REQUEST_COUNTER: CounterVec = register_counter_vec!(
        "devforge_requests_total",
        "Total requests",
        &["service", "endpoint", "status"]
    ).unwrap();
    
    static ref REQUEST_DURATION: HistogramVec = register_histogram_vec!(
        "devforge_request_duration_seconds",
        "Request duration",
        &["service", "endpoint"],
        vec![0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
    ).unwrap();
}

// 使用
async fn handle_request(req: Request) -> Response {
    let timer = REQUEST_DURATION.with_label_values(&["know", "/api/notes"]).start_timer();
    
    let result = process_request(req).await;
    
    timer.observe_duration();
    REQUEST_COUNTER.with_label_values(&["know", "/api/notes", &status]).inc();
    
    result
}
```

### 分布式追踪

```rust
// OpenTelemetry集成
#[tracing::instrument(skip(db))]
async fn create_note(db: &PgPool, user_id: Uuid, data: CreateNoteRequest) -> Result<Note> {
    tracing::info!("Creating note for user: {}", user_id);
    
    let note = sqlx::query_as::<_, Note>(
        "INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(user_id)
    .bind(&data.title)
    .bind(&data.content)
    .fetch_one(db)
    .await?;
    
    tracing::info!("Note created: {}", note.id);
    Ok(note)
}
```

---

## 🚀 部署架构

### Kubernetes 部署

```yaml
# devforge-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: devforge
  labels:
    istio-injection: enabled

---
# auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: devforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth
        image: devforge/auth-service:v2.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 服务网格 (Istio)

```yaml
# virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: devforge-api
  namespace: devforge
spec:
  hosts:
  - api.devforge.io
  gateways:
  - devforge-gateway
  http:
  - match:
    - uri:
        prefix: /api/v2/auth
    route:
    - destination:
        host: auth-service
        port:
          number: 8080
  - match:
    - uri:
        prefix: /api/v2/know
    route:
    - destination:
        host: know-service
        port:
          number: 8080
```

---

## 📅 开发计划

### Phase 1: 基础设施 (Week 1-2)
- [ ] 项目脚手架
- [ ] CI/CD Pipeline
- [ ] 数据库迁移
- [ ] 基础服务框架

### Phase 2: 核心服务 (Week 3-6)
- [ ] Auth Service
- [ ] Know Service
- [ ] 基础前端

### Phase 3: AI功能 (Week 7-10)
- [ ] Code Service
- [ ] Local LLM集成
- [ ] Vector DB

### Phase 4: 自动化 (Week 11-14)
- [ ] Flow Service
- [ ] Temporal集成
- [ ] Deploy Service

### Phase 5: 优化上线 (Week 15-18)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 监控完善
- [ ] 文档更新

---

**架构设计完成，等待审阅确认后开始实施。**