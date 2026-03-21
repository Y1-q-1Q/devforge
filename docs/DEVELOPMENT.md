# DevForge 开发文档

## 项目结构

```
devforge/
├── knowforge/          # 知识管理系统
│   ├── README.md
│   ├── server.js       # Express后端
│   ├── public/         # 前端界面
│   └── package.json
│
├── codeforge/          # AI编程助手
│   ├── README.md
│   ├── src/
│   │   └── extension.ts    # VSCode插件主代码
│   ├── out/            # 编译输出
│   ├── package.json
│   └── tsconfig.json
│
├── docs/               # 架构文档
│   └── ARCHITECTURE.md
│
├── README.md           # 项目总览
└── LICENSE             # MIT协议
```

## 快速开始

### KnowForge (知识管理)

```bash
cd knowforge
npm install
npm start
# 打开 http://localhost:3000
```

### CodeForge (AI编程助手)

```bash
cd codeforge
npm install
npm run compile
# 在VSCode中按F5运行插件
```

## 开发规范

### 代码风格
- 使用TypeScript
- 2空格缩进
- 单引号
- 分号必须

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
ci: CI/CD
```

## API文档

### KnowForge API

#### POST /api/notes
创建笔记
```json
{
  "title": "笔记标题",
  "content": "笔记内容",
  "tags": "标签1,标签2"
}
```

#### GET /api/notes
获取所有笔记
```
GET /api/notes?search=关键词
```

#### PUT /api/notes/:id
更新笔记

#### DELETE /api/notes/:id
删除笔记

### CodeForge API

使用OpenAI API，需要设置API Key。

## 部署指南

### KnowForge
```bash
cd knowforge
npm install --production
npm start
```

### CodeForge
1. 在VSCode中打包插件
2. 发布到VSCode Marketplace

## 路线图

### Phase 1 (当前)
- [x] KnowForge MVP
- [x] CodeForge MVP

### Phase 2 (下周)
- [ ] FlowForge 工作流自动化
- [ ] 统一UI组件库
- [ ] 用户反馈系统

### Phase 3 (下月)
- [ ] DeployForge 部署工具
- [ ] 云端同步
- [ ] 团队协作

## 贡献指南

1. Fork 仓库
2. 创建分支: `git checkout -b feature/xxx`
3. 提交更改: `git commit -m 'feat: xxx'`
4. 推送分支: `git push origin feature/xxx`
5. 创建 Pull Request

## 联系方式

- GitHub: https://github.com/Y1-q-1Q/devforge
- Email: (待添加)

---

*持续更新中...*