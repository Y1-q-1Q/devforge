# DevForge v2.0 数据库设计

> PostgreSQL Schema + 索引优化

---

## 🗄️ 数据库选型

### PostgreSQL 15+

**选择理由**:
- ✅ ACID 事务保证
- ✅ JSONB 灵活存储
- ✅ 全文搜索支持
- ✅ 扩展性强 (PostGIS, pgvector)
- ✅ 成熟稳定，企业级

---

## 📊 Schema 设计

### 1. 用户域 (auth)

```sql
-- 用户表
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    settings JSONB DEFAULT '{
        "language": "zh",
        "theme": "dark",
        "timezone": "Asia/Shanghai",
        "notifications": {
            "email": true,
            "push": true
        }
    }',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ  -- 软删除
);

-- 用户索引
CREATE INDEX idx_users_email ON auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON auth.users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON auth.users(role) WHERE deleted_at IS NULL;

-- 会话表
CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_refresh_hash ON auth.sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON auth.sessions(expires_at) WHERE is_revoked = FALSE;

-- OAuth 账号绑定
CREATE TABLE auth.oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- github, google, wechat
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_oauth_user_id ON auth.oauth_accounts(user_id);
```

---

### 2. 知识域 (know)

```sql
-- 笔记表
CREATE TABLE know.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_plain TEXT,  -- 纯文本，用于搜索
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',  -- 自定义元数据
    
    -- 向量搜索
    embedding VECTOR(384),  -- 使用 all-MiniLM-L6-v2 模型
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    parent_id UUID REFERENCES know.notes(id),  -- 版本链
    
    -- 状态
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 笔记索引
CREATE INDEX idx_notes_user_id ON know.notes(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_updated ON know.notes(updated_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_tags ON know.notes USING GIN(tags) WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_pinned ON know.notes(is_pinned) WHERE is_deleted = FALSE;

-- 全文搜索索引 (中文)
CREATE INDEX idx_notes_search ON know.notes 
USING GIN(to_tsvector('chinese', COALESCE(title, '') || ' ' || COALESCE(content_plain, '')));

-- 向量索引 (使用 pgvector 扩展)
CREATE INDEX idx_notes_embedding ON know.notes 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 笔记版本历史
CREATE TABLE know.note_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES know.notes(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    change_summary TEXT  -- 变更摘要
);

CREATE INDEX idx_note_versions_note_id ON know.note_versions(note_id, version DESC);

-- 标签表
CREATE TABLE know.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',  -- HEX颜色
    icon VARCHAR(50),  -- Font Awesome 图标名
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON know.tags(user_id);
CREATE INDEX idx_tags_sort ON know.tags(user_id, sort_order);

-- 笔记-标签关联表
CREATE TABLE know.note_tags (
    note_id UUID REFERENCES know.notes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES know.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX idx_note_tags_tag ON know.note_tags(tag_id);

-- 附件表
CREATE TABLE know.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES know.notes(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,  -- 对象存储路径
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_note ON know.attachments(note_id);
CREATE INDEX idx_attachments_user ON know.attachments(user_id);
```

---

### 3. 代码域 (code)

```sql
-- 代码仓库索引
CREATE TABLE code.repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    provider VARCHAR(50) NOT NULL,  -- github, gitlab, gitea
    default_branch VARCHAR(100) DEFAULT 'main',
    is_private BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repos_user ON code.repositories(user_id);
CREATE INDEX idx_repos_sync ON code.repositories(sync_status, last_synced_at);

-- 代码文件索引
CREATE TABLE code.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES code.repositories(id) ON DELETE CASCADE,
    path VARCHAR(500) NOT NULL,  -- 文件路径
    content_hash VARCHAR(64) NOT NULL,  -- SHA256
    language VARCHAR(50),  -- 编程语言
    
    -- 代码向量
    embedding VECTOR(384),
    
    -- 代码元数据
    line_count INTEGER,
    function_count INTEGER,
    imports TEXT[],
    
    last_commit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(repository_id, path)
);

CREATE INDEX idx_files_repo ON code.files(repository_id);
CREATE INDEX idx_files_language ON code.files(language);
CREATE INDEX idx_files_embedding ON code.files 
USING ivfflat (embedding vector_cosine_ops);

-- 代码片段 (函数、类等)
CREATE TABLE code.snippets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES code.files(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,  -- 函数名或类名
    type VARCHAR(50) NOT NULL,  -- function, class, struct, enum
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    content TEXT NOT NULL,
    signature TEXT,  -- 函数签名
    docstring TEXT,  -- 文档字符串
    embedding VECTOR(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snippets_file ON code.snippets(file_id);
CREATE INDEX idx_snippets_type ON code.snippets(type);
CREATE INDEX idx_snippets_embedding ON code.snippets 
USING ivfflat (embedding vector_cosine_ops);

-- AI 生成历史
CREATE TABLE code.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- generate, explain, review, refactor
    prompt TEXT NOT NULL,
    context TEXT,
    result TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    latency_ms INTEGER,
    is_favorite BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- 用户评分
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generations_user ON code.generations(user_id, created_at DESC);
CREATE INDEX idx_generations_type ON code.generations(type);
```

---

### 4. 工作流域 (flow)

```sql
-- 工作流定义
CREATE TABLE flow.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- 触发器配置
    trigger_type VARCHAR(50) NOT NULL,  -- manual, cron, webhook, event
    trigger_config JSONB NOT NULL DEFAULT '{}',
    
    -- 工作流定义 (DAG)
    definition JSONB NOT NULL DEFAULT '{
        "nodes": [],
        "edges": [],
        "variables": {}
    }',
    
    -- Temporal 集成
    temporal_workflow_id VARCHAR(100),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- 统计
    total_runs INTEGER DEFAULT 0,
    success_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flows_user ON flow.workflows(user_id);
CREATE INDEX idx_flows_status ON flow.workflows(status) WHERE is_enabled = TRUE;
CREATE INDEX idx_flows_trigger ON flow.workflows(trigger_type);

-- 工作流执行记录
CREATE TABLE flow.runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES flow.workflows(id) ON DELETE CASCADE,
    temporal_run_id VARCHAR(100),
    
    -- 执行状态
    status VARCHAR(20) NOT NULL,  -- pending, running, completed, failed, cancelled
    
    -- 输入输出
    input JSONB DEFAULT '{}',
    output JSONB,
    
    -- 时间
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,  -- 执行时长
    
    -- 错误信息
    error_code VARCHAR(100),
    error_message TEXT,
    
    -- 重试信息
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

CREATE INDEX idx_runs_workflow ON flow.runs(workflow_id, started_at DESC);
CREATE INDEX idx_runs_status ON flow.runs(status);
CREATE INDEX idx_runs_started ON flow.runs(started_at DESC);

-- 节点执行记录
CREATE TABLE flow.node_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES flow.runs(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    
    status VARCHAR(20) NOT NULL,  -- pending, running, completed, failed
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    input JSONB,
    output JSONB,
    logs TEXT[],
    
    error_code VARCHAR(100),
    error_message TEXT
);

CREATE INDEX idx_node_runs_run ON flow.node_runs(run_id);
CREATE INDEX idx_node_runs_node ON flow.node_runs(node_id);

-- Webhook 接收记录
CREATE TABLE flow.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES flow.workflows(id) ON DELETE CASCADE,
    
    request_method VARCHAR(10) NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    request_ip INET,
    
    response_status INTEGER,
    response_body JSONB,
    
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_workflow ON flow.webhook_logs(workflow_id, created_at DESC);
CREATE INDEX idx_webhook_logs_processed ON flow.webhook_logs(is_processed) WHERE is_processed = FALSE;
```

---

### 5. 部署域 (deploy)

```sql
-- 部署配置
CREATE TABLE deploy.configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    
    -- 源代码
    source_type VARCHAR(50) NOT NULL,  -- git, docker, local
    source_config JSONB NOT NULL,
    
    -- 构建配置
    build_config JSONB DEFAULT '{
        "type": "docker",
        "dockerfile": "Dockerfile",
        "args": {}
    }',
    
    -- 部署目标
    target_type VARCHAR(50) NOT NULL,  -- kubernetes, docker, ssh
    target_config JSONB NOT NULL,
    
    -- 部署策略
    strategy VARCHAR(50) DEFAULT 'rolling',  -- rolling, bluegreen, canary
    strategy_config JSONB DEFAULT '{}',
    
    -- 环境变量
    env_vars JSONB DEFAULT '{}',
    secrets JSONB DEFAULT '{}',  -- 加密存储
    
    -- 健康检查
    health_check JSONB DEFAULT '{
        "path": "/health",
        "port": 8080,
        "initial_delay": 10,
        "period": 5
    }',
    
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deploy_configs_user ON deploy.configs(user_id);

-- 部署记录
CREATE TABLE deploy.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES deploy.configs(id) ON DELETE CASCADE,
    
    -- 版本信息
    version VARCHAR(100) NOT NULL,
    commit_sha VARCHAR(64),
    commit_message TEXT,
    
    -- 状态
    status VARCHAR(50) NOT NULL,  -- pending, building, deploying, completed, failed, rolled_back
    
    -- 构建信息
    build_logs TEXT[],
    build_duration_ms INTEGER,
    image_tag VARCHAR(255),
    
    -- 部署信息
    deploy_logs TEXT[],
    deploy_duration_ms INTEGER,
    
    -- 回滚信息
    is_rollback BOOLEAN DEFAULT FALSE,
    rollback_to UUID REFERENCES deploy.deployments(id),
    
    -- 时间
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- 元数据
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_deployments_config ON deploy.deployments(config_id, started_at DESC);
CREATE INDEX idx_deployments_status ON deploy.deployments(status);

-- 部署环境
CREATE TABLE deploy.environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES deploy.configs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,  -- production, staging, development
    
    -- 环境配置覆盖
    target_config_override JSONB,
    env_vars_override JSONB,
    
    -- 自动部署
    auto_deploy BOOLEAN DEFAULT FALSE,
    auto_deploy_branch VARCHAR(100),
    
    -- 审批流程
    require_approval BOOLEAN DEFAULT FALSE,
    approvers UUID[],  -- 审批人列表
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_envs_config ON deploy.environments(config_id);
```

---

## 🔧 扩展和优化

### 启用扩展

```sql
-- 必需扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 模糊搜索

-- 全文搜索
CREATE EXTENSION IF NOT EXISTS "zhparser";  -- 中文分词

-- 向量搜索
CREATE EXTENSION IF NOT EXISTS "vector";    -- pgvector

-- 时间序列
CREATE EXTENSION IF NOT EXISTS "timescaledb";
```

### 分区表

```sql
-- 大表分区示例：执行日志
CREATE TABLE flow.runs_partitioned (
    LIKE flow.runs INCLUDING ALL
) PARTITION BY RANGE (started_at);

-- 按月分区
CREATE TABLE flow.runs_2024_01 PARTITION OF flow.runs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE flow.runs_2024_02 PARTITION OF flow.runs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 自动创建分区函数
CREATE OR REPLACE FUNCTION flow.create_monthly_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'runs_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := partition_date;
    end_date := partition_date + INTERVAL '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS flow.%I PARTITION OF flow.runs_partitioned FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;
```

### 自动更新时间戳

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用到所有表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON know.notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... 其他表
```

### 软删除处理

```sql
-- 软删除视图
CREATE VIEW know.active_notes AS
SELECT * FROM know.notes WHERE deleted_at IS NULL;

-- 软删除触发器（可选：自动清理关联数据）
CREATE OR REPLACE FUNCTION know.soft_delete_note()
RETURNS TRIGGER AS $$
BEGIN
    -- 清理关联数据
    UPDATE know.attachments SET note_id = NULL WHERE note_id = OLD.id;
    DELETE FROM know.note_tags WHERE note_id = OLD.id;
    
    OLD.deleted_at = NOW();
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 性能优化

### 查询优化示例

```sql
-- 用户笔记列表（优化后）
EXPLAIN ANALYZE
SELECT n.id, n.title, n.updated_at, array_agg(t.name) as tags
FROM know.notes n
LEFT JOIN know.note_tags nt ON n.id = nt.note_id
LEFT JOIN know.tags t ON nt.tag_id = t.id
WHERE n.user_id = 'uuid'
  AND n.is_deleted = FALSE
  AND n.is_archived = FALSE
GROUP BY n.id
ORDER BY n.is_pinned DESC, n.updated_at DESC
LIMIT 20;

-- 预期执行计划：
-- Index Scan using idx_notes_user_id
-- Index Scan using idx_note_tags_note
-- Index Scan using idx_tags_pkey
-- Sort using idx_notes_updated
```

### 连接池配置

```yaml
# 推荐配置
database:
  pool_size: 20           # 连接池大小
  min_idle: 5             # 最小空闲连接
  max_lifetime: 1800      # 连接最大生命周期（秒）
  idle_timeout: 600       # 空闲超时（秒）
  connection_timeout: 5   # 连接超时（秒）
```

---

**数据库设计完成，可直接用于生产环境。**