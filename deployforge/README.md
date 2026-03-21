# 🚀 DeployForge

> 一键部署工具，零配置上线你的项目

---

## ✨ 功能特性

### ☁️ 多平台支持

**国外平台**:
- Vercel - 前端项目
- Netlify - 静态网站
- GitHub Pages - 免费托管
- Railway - 全栈应用
- Render - 全栈应用

**国内平台**:
- 阿里云 OSS
- 腾讯云 COS
- 又拍云

**自建服务器**:
- SSH 部署
- Docker 部署

### 🔍 自动检测
- 自动识别项目类型
- 自动检测构建命令
- 自动识别输出目录

### 🌍 多语言支持
- 中文 / English
- `--language` 选项

### ⚡ 快速部署
- 交互式配置
- 一键部署
- 进度显示

---

## 🚀 快速开始

### 安装

```bash
cd deployforge
npm install
npm link
```

### 初始化配置

在项目目录中运行：

```bash
deployforge init
```

按提示选择：
1. 项目名称
2. 部署平台
3. 构建命令
4. 输出目录

### 一键部署

```bash
deployforge deploy
```

---

## 📖 使用指南

### 查看支持的平台

```bash
# 中文
deployforge platforms --language zh

# English
deployforge platforms --language en
```

### 初始化项目

```bash
deployforge init
```

选项：
- `-l, --language <lang>` - 设置语言 (zh/en)

### 部署项目

```bash
# 使用配置的平台
deployforge deploy

# 指定平台
deployforge deploy --platform vercel

# 指定服务器（SSH）
deployforge deploy --server my-server.com
```

### 管理配置

```bash
# 查看配置
deployforge config --list

# 获取配置项
deployforge config --get platform

# 设置配置项
deployforge config --set platform=vercel
```

---

## 🛠️ 技术栈

- **语言**: Node.js
- **CLI**: Commander.js
- **交互**: Readline
- **压缩**: Archiver
- **SSH**: SSH2

---

## 📁 项目结构

```
deployforge/
├── bin/
│   └── deployforge.js  # CLI 入口
├── lib/
│   └── index.js       # 核心逻辑
├── package.json
└── README.md
```

---

## 🔧 配置文件

配置文件 `deployforge.json`:

```json
{
  "name": "my-project",
  "platform": "vercel",
  "buildCommand": "npm run build",
  "outputDir": "dist",
  "language": "zh"
}
```

### SSH 配置

```json
{
  "platform": "ssh",
  "ssh": {
    "host": "my-server.com",
    "username": "root",
    "port": 22,
    "deployPath": "/var/www/html"
  }
}
```

---

## 🐛 常见问题

### 部署失败？

1. 检查平台 CLI 是否已安装
2. 检查配置是否正确
3. 检查网络连接

### 如何切换语言？

```bash
# 初始化时设置
deployforge init --language en

# 或修改配置文件
```

### 支持哪些项目类型？

自动检测：
- React / Vue / Angular
- Next.js / Nuxt.js
- Astro / Gatsby / Hexo
- 静态网站

---

## 📄 许可证

[MIT](../LICENSE) © tinyfish

---

<p align="center">
  <a href="https://github.com/Y1-q-1Q/devforge">← 返回 DevForge</a>
</p>