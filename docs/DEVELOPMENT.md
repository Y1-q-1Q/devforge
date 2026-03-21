# 📖 DevForge 开发指南

> 开发规范、贡献指南和最佳实践

---

## 🎯 核心准则

### 用户第一
- 所有设计必须考虑用户个性化
- 多语言是开发的基础要求
- 用户配置可持久化

### 代码质量
- 100分标准，不妥协
- 完善的错误处理
- 全面的测试覆盖

### 文档优先
- 代码即文档
- 及时更新README
- 保持文档一致性

---

## 🛠️ 开发环境

### 环境要求

- **Node.js**: 18+
- **Git**: 2.30+
- **VSCode**: 最新版（推荐）

### 推荐插件

- ESLint
- Prettier
- TypeScript
- GitLens

---

## 📁 项目结构

```
devforge/
├── 📄 README.md              # 项目总览
├── 📄 LICENSE                # MIT 许可证
├── 📁 docs/                  # 文档目录
│   ├── ARCHITECTURE.md       # 架构文档
│   ├── DEVELOPMENT.md        # 本文件
│   ├── PERSONALIZATION_DESIGN.md  # 个性化设计
│   └── MARKET_VALIDATION.md  # 市场验证
│
├── 🧠 knowforge/            # 知识管理
│   ├── README.md
│   ├── package.json
│   ├── server.js
│   ├── public/
│   └── src/
│       ├── i18n/            # 多语言
│       └── config/          # 配置
│
├── 🤖 codeforge/            # AI编程助手
│   ├── README.md
│   ├── package.json
│   ├── src/
│   │   ├── extension.ts
│   │   └── i18n.ts
│   └── out/                 # 编译输出
│
├── ⚡ flowforge/            # 工作流自动化
│   ├── README.md
│   ├── package.json
│   ├── server.js
│   └── public/
│
└── 🚀 deployforge/          # 一键部署
    ├── README.md
    ├── package.json
    ├── bin/
    └── lib/
```

---

## 📝 代码规范

### 命名规范

```javascript
// 变量 - camelCase
const userName = 'tinyfish';

// 常量 - UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 函数 - camelCase
function getUserInfo() {}

// 类 - PascalCase
class WorkflowEngine {}

// 文件 - kebab-case
user-config.js
workflow-engine.ts
```

### 注释规范

```javascript
/**
 * 执行工作流
 * @param {Object} workflow - 工作流对象
 * @param {string} workflow.id - 工作流ID
 * @returns {Promise<Object>} 执行结果
 */
async function executeWorkflow(workflow) {
  // 验证工作流配置
  validateWorkflow(workflow);
  
  // TODO: 添加错误重试机制
  return await run(workflow);
}
```

### 错误处理

```javascript
// ✅ 好的做法
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error.message);
  throw new Error(`Failed to execute: ${error.message}`);
}

// ❌ 不好的做法
try {
  const result = await riskyOperation();
} catch (e) {
  // 空 catch
}
```

---

## 🌍 多语言开发

### 添加新语言

1. 在 `src/i18n/` 创建语言文件

```javascript
// src/i18n/ja.json
{
  "app.name": "KnowForge",
  "app.tagline": "あなたの第二の脳",
  // ...
}
```

2. 在 i18n 模块中注册

```javascript
// src/i18n/index.js
loadLocale('ja');
```

3. 更新语言选择器

```html
<select id="language">
  <option value="zh">中文</option>
  <option value="en">English</option>
  <option value="ja">日本語</option>
</select>
```

### 翻译规范

- 保持简洁
- 使用正式语气
- 避免俚语
- 考虑文化差异

---

## 🎨 主题开发

### CSS 变量

```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --accent: #3b82f6;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
}
```

### 切换主题

```javascript
function changeTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

---

## 🔄 Git 工作流

### 分支命名

```
feature/xxx      # 新功能
fix/xxx          # Bug 修复
docs/xxx         # 文档更新
refactor/xxx     # 重构
```

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具
```

### 示例

```bash
git commit -m "feat: add dark mode support

- Add CSS variables for theming
- Add theme toggle button
- Save preference to localStorage"
```

---

## 🧪 测试

### 单元测试

```javascript
// tests/api.test.js
describe('API Tests', () => {
  it('should create a note', async () => {
    const response = await request(app)
      .post('/api/notes')
      .send({ title: 'Test', content: 'Content' });
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

### 运行测试

```bash
npm test
```

---

## 📦 发布流程

### 版本号规范

遵循 [SemVer](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0    # 重大更新
1.1.0    # 新功能
1.1.1    # Bug 修复
```

### 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG 已更新
- [ ] 版本号已更新
- [ ] Git tag 已创建

---

## 🤝 贡献指南

### 如何贡献

1. **Fork** 仓库
2. **创建分支**: `git checkout -b feature/xxx`
3. **开发功能**
4. **更新文档**
5. **提交 PR**

### PR 规范

- 清晰的标题和描述
- 关联相关 Issue
- 包含测试
- 更新文档

### Code Review

- 至少 1 人 review
- 解决所有评论
- 保持礼貌和尊重

---

## 🐛 调试技巧

### Node.js 调试

```bash
# 使用 inspect
node --inspect server.js

# 使用 ndb
npx ndb server.js
```

### VSCode 调试

按 `F5` 启动调试，支持：
- 断点
- 单步执行
- 变量查看
- 调用堆栈

### 日志调试

```javascript
// 使用 console
console.log('Debug:', value);
console.table(array);
console.time('operation');
console.timeEnd('operation');
```

---

## 📚 学习资源

### 前端
- [MDN Web Docs](https://developer.mozilla.org/)
- [TailwindCSS](https://tailwindcss.com/)

### 后端
- [Node.js 文档](https://nodejs.org/docs/)
- [Express 指南](https://expressjs.com/)

### AI
- [OpenAI API](https://platform.openai.com/docs/)

---

## 💬 社区

- **GitHub Issues**: Bug 报告和功能请求
- **GitHub Discussions**: 一般讨论
- **Email**: (待添加)

---

## 📄 许可证

[MIT](../LICENSE) © tinyfish

---

<p align="center">
  <a href="https://github.com/Y1-q-1Q/devforge">← 返回 DevForge</a>
</p>