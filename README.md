# DevForge - Developer Productivity Suite

> 让个人开发者拥有大厂的开发效率和资源

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Y1-q-1Q/devforge.git
cd devforge
```

### 2. 启动 KnowForge (知识管理)

```bash
cd knowforge
npm install
npm start
```

打开浏览器访问: http://localhost:3000

### 3. 安装 CodeForge (AI编程助手)

```bash
cd codeforge
npm install
npm run compile
```

在VSCode中:
1. 按 `F5` 打开扩展开发窗口
2. 使用 `Ctrl+Shift+G` 生成代码
3. 使用 `Ctrl+Shift+E` 解释代码

## 🏗️ 生态架构

```
DevForge
├── 🧠 KnowForge    # 知识管理系统 ✅
├── 🤖 CodeForge    # AI编程助手 ✅
├── ⚡ FlowForge    # 工作流自动化 (规划中)
└── 🚀 DeployForge  # 一键部署工具 (规划中)
```

## 📦 模块介绍

### KnowForge - 知识管理

为开发者打造的第二大脑。

**功能**:
- ✅ 笔记增删改查
- ✅ 全文搜索
- ✅ 标签管理
- ✅ 响应式界面

**使用**:
```bash
cd knowforge
npm start
```

### CodeForge - AI编程助手

开源的AI编程助手，让独立开发者也能享受企业级AI辅助。

**功能**:
- ✅ 代码生成 (Ctrl+Shift+G)
- ✅ 代码解释 (Ctrl+Shift+E)
- ✅ 代码审查
- ✅ 代码重构
- ✅ OpenAI API集成

**配置**:
1. 获取 OpenAI API Key
2. 在VSCode设置中搜索 "CodeForge"
3. 填入 API Key

**使用**:
- 选中代码，右键选择 CodeForge 命令
- 或使用快捷键

## 🛠️ 开发

### 环境要求
- Node.js 18+
- VSCode (用于CodeForge开发)
- OpenAI API Key (用于AI功能)

### 开发文档

- [开发指南](docs/DEVELOPMENT.md)
- [架构文档](docs/ARCHITECTURE.md)

### 提交代码

```bash
git add .
git commit -m "feat: your feature"
git push origin main
```

## 📈 路线图

### Phase 1: 基础搭建 ✅
- [x] KnowForge MVP
- [x] CodeForge MVP
- [x] 文档和测试

### Phase 2: 生态扩展 (进行中)
- [ ] FlowForge 工作流自动化
- [ ] 统一UI组件库
- [ ] 用户反馈系统

### Phase 3: 平台化
- [ ] DeployForge 部署工具
- [ ] 云端同步
- [ ] 团队协作

## 🤝 贡献

欢迎提交 Issue 和 PR！

### 贡献流程
1. Fork 仓库
2. 创建分支: `git checkout -b feature/xxx`
3. 提交更改: `git commit -m 'feat: xxx'`
4. 推送分支: `git push origin feature/xxx`
5. 创建 Pull Request

## 📄 许可证

[MIT](LICENSE) © tinyfish

## 🔗 链接

- GitHub: https://github.com/Y1-q-1Q/devforge
- Issues: https://github.com/Y1-q-1Q/devforge/issues

---

*持续构建中...*