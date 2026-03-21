# ⚡ FlowForge

> 工作流自动化引擎，让重复工作自动执行

<p align="center">
  <img src="../docs/screenshots/flowforge-screenshot.png" alt="FlowForge Screenshot" width="800">
</p>

---

## ✨ 功能特性

### 🔄 工作流编排
- 可视化流程设计
- 拖拽式节点编排
- 条件分支支持
- 循环处理

### ⏰ 多种触发器
- **手动触发** - 点击运行
- **定时触发** - Cron 表达式
- **Webhook** - HTTP 请求触发

### 🔧 执行节点
- **Shell** - 执行系统命令
- **HTTP** - 调用 API 接口
- **Delay** - 延迟等待
- **Log** - 输出日志

### 🌍 多语言支持
- 中文 / English
- 一键切换

### 🎨 个性化主题
- 深色模式
- 浅色模式

---

## 🚀 快速开始

### 安装

```bash
cd flowforge
npm install
```

### 启动

```bash
npm start
```

访问 http://localhost:3001

---

## 📖 使用指南

### 创建工作流

1. 点击「新建工作流」按钮
2. 输入名称和描述
3. 选择触发器类型
4. 添加执行节点
5. 保存并激活

### 添加节点

1. 点击「添加节点」
2. 选择节点类型：
   - Shell 命令
   - HTTP 请求
   - 延迟等待
   - 日志记录
3. 配置节点参数

### 定时触发

使用 Cron 表达式：
- `*/5 * * * *` - 每5分钟
- `0 9 * * *` - 每天9点
- `0 0 * * 0` - 每周日零点

格式：分 时 日 月 周

### 手动运行

点击工作流卡片上的「运行」按钮

### 查看执行历史

点击工作流查看执行记录和日志

---

## 🛠️ 技术栈

- **前端**: HTML5 + TailwindCSS
- **后端**: Node.js + Express
- **调度**: node-cron
- **存储**: JSON 文件

---

## 📁 项目结构

```
flowforge/
├── public/
│   └── index.html      # 前端界面
├── server.js          # Express + 工作流引擎
├── package.json
└── README.md
```

---

## 🔌 API 接口

### 工作流管理

```
GET    /api/workflows          # 获取所有工作流
POST   /api/workflows          # 创建工作流
GET    /api/workflows/:id      # 获取单个工作流
PUT    /api/workflows/:id      # 更新工作流
DELETE /api/workflows/:id      # 删除工作流
```

### 执行控制

```
POST /api/workflows/:id/run         # 手动运行
POST /api/workflows/:id/activate    # 激活
POST /api/workflows/:id/deactivate  # 停用
```

---

## 🐛 常见问题

### 定时任务不执行？

1. 检查工作流是否已激活
2. 检查 Cron 表达式是否正确
3. 查看服务器日志

### 如何调试工作流？

1. 手动运行工作流
2. 查看执行日志
3. 检查每个节点的输出

---

## 📄 许可证

[MIT](../LICENSE) © tinyfish

---

<p align="center">
  <a href="https://github.com/Y1-q-1Q/devforge">← 返回 DevForge</a>
</p>