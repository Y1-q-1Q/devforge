# DevForge - Developer Productivity Suite

<p align="center">
  <img src="docs/assets/logo.png" alt="DevForge Logo" width="120">
</p>

<p align="center">
  <strong>让个人开发者拥有大厂的开发效率和资源</strong>
</p>

<p align="center">
  <a href="https://github.com/Y1-q-1Q/devforge/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-18%2B-green.svg" alt="Node.js 18+">
  </a>
  <a href="https://github.com/Y1-q-1Q/devforge/stargazers">
    <img src="https://img.shields.io/github/stars/Y1-q-1Q/devforge" alt="GitHub Stars">
  </a>
</p>

---

## 🏗️ 生态架构

```
┌─────────────────────────────────────────────────────────┐
│                    DevForge 生态系统                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  KnowForge  │  │  CodeForge  │  │  FlowForge  │    │
│  │   🧠 知识   │  │   🤖 AI    │  │   ⚡ 自动化  │    │
│  │    管理     │  │   编程助手  │  │   工作流    │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          │                              │
│              ┌───────────┴───────────┐                  │
│              │     🚀 DeployForge     │                  │
│              │      一键部署           │                  │
│              └────────────────────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ 核心特性

- 🌍 **多语言支持** - 中文/英文切换
- 🎨 **主题切换** - 深色/浅色模式
- ⚙️ **个性化配置** - 字体大小、快捷键等
- 🔒 **数据隐私** - 本地优先，数据自主
- 🚀 **开箱即用** - 零配置快速开始

---

## 📦 模块介绍

### 🧠 KnowForge - 知识管理

> 你的第二大脑，专为开发者设计

**功能特性**:
- ✅ 笔记管理 + 全文搜索
- ✅ 标签系统 + 分类管理
- ✅ 自动备份（保留10个版本）
- ✅ 数据导入/导出
- ✅ 多语言支持（中文/英文）
- ✅ 深色/浅色主题
- ✅ 响应式界面

**快速开始**:
```bash
cd knowforge
npm install
npm start
# 打开 http://localhost:3000
```

---

### 🤖 CodeForge - AI 编程助手

> 开源的 AI 编程助手，VSCode 插件

**功能特性**:
- ✅ 代码生成（Ctrl+Shift+G）
- ✅ 代码解释（Ctrl+Shift+E）
- ✅ 代码审查
- ✅ 代码重构
- ✅ 使用统计
- ✅ 多语言支持
- ✅ 响应缓存

**快速开始**:
```bash
cd codeforge
npm install
npm run compile
# 在 VSCode 中按 F5 运行
```

---

### ⚡ FlowForge - 工作流自动化

> 让重复工作自动化执行

**功能特性**:
- ✅ 可视化工作流编排
- ✅ 定时触发（Cron）
- ✅ Webhook 触发
- ✅ 多种执行节点（Shell/HTTP/延迟/日志）
- ✅ 执行历史记录
- ✅ 多语言支持
- ✅ 深色/浅色主题

**快速开始**:
```bash
cd flowforge
npm install
npm start
# 打开 http://localhost:3001
```

---

### 🚀 DeployForge - 一键部署

> 零配置部署解决方案

**功能特性**:
- ✅ 多平台支持（Vercel/Netlify/GitHub Pages/SSH/Docker）
- ✅ 自动识别项目类型
- ✅ 交互式配置
- ✅ 部署进度显示
- ✅ 多语言支持

**快速开始**:
```bash
cd deployforge
npm install
npm link

# 在项目目录中运行
deployforge init    # 初始化配置
deployforge deploy  # 一键部署
```

---

## 🛠️ 技术栈

| 模块 | 前端 | 后端 | 特色技术 |
|------|------|------|----------|
| KnowForge | HTML + TailwindCSS | Node.js + Express | 本地 JSON 存储 |
| CodeForge | VSCode WebView | TypeScript + VSCode API | OpenAI 集成 |
| FlowForge | React-like 组件 | Node.js + node-cron | 任务调度引擎 |
| DeployForge | CLI 交互 | Node.js + Commander | 多平台适配器 |

---

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Y1-q-1Q/devforge.git
cd devforge
```

### 2. 启动所需模块

**启动知识管理**:
```bash
cd knowforge
npm install && npm start
# 访问 http://localhost:3000
```

**启动工作流自动化**:
```bash
cd flowforge
npm install && npm start
# 访问 http://localhost:3001
```

### 3. 安装 VSCode 插件

```bash
cd codeforge
npm install && npm run compile
# 在 VSCode 中按 F5
```

---

## 📚 文档

- [📖 开发指南](docs/DEVELOPMENT.md) - 开发规范和贡献指南
- [🏗️ 架构文档](docs/ARCHITECTURE.md) - 系统架构设计
- [🎨 个性化设计](docs/PERSONALIZATION_DESIGN.md) - 多语言和主题设计
- [📊 市场验证](docs/MARKET_VALIDATION.md) - 市场验证策略

---

## 🎯 核心准则

### 用户第一
- 所有设计必须考虑用户个性化
- 多语言是开发的基础要求
- 用户配置可持久化

### 市场导向
- 边开发边迭代边验证
- 市场不认一切白费
- 数据驱动决策

### 代码质量
- 100 分标准
- 完善的错误处理
- 全面的测试覆盖

---

## 📈 路线图

### Phase 1: 基础搭建 ✅
- [x] KnowForge MVP
- [x] CodeForge MVP
- [x] FlowForge MVP
- [x] DeployForge MVP
- [x] 多语言支持
- [x] 个性化系统

### Phase 2: 生态扩展 🚧
- [ ] 模块间数据联动
- [ ] 统一用户系统
- [ ] 云端同步（可选）
- [ ] 插件市场

### Phase 3: 平台化
- [ ] 团队协作
- [ ] 企业版功能
- [ ] 高级分析

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

### 贡献流程

1. **Fork** 仓库
2. **创建分支**: `git checkout -b feature/xxx`
3. **提交更改**: `git commit -m 'feat: xxx'`
4. **推送分支**: `git push origin feature/xxx`
5. **创建 Pull Request**

### 代码规范

- 使用 TypeScript（推荐）
- 遵循 ESLint 规范
- 添加必要的注释
- 更新相关文档

---

## 📄 许可证

[MIT](LICENSE) © tinyfish

---

## 🔗 链接

- 🌐 **GitHub**: https://github.com/Y1-q-1Q/devforge
- 🐛 **Issues**: https://github.com/Y1-q-1Q/devforge/issues
- 💬 **Discussions**: https://github.com/Y1-q-1Q/devforge/discussions

---

<p align="center">
  <strong>⭐ Star 我们 if you find it helpful!</strong>
</p>

<p align="center">
  Made with ❤️ by tinyfish
</p>