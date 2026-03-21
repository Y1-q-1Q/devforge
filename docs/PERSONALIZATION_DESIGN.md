# DevForge 个性化设置系统设计

> 核心准则：用户认可是基石，所有设计必须考虑个性化

---

## 🎯 设计原则

### 1. 用户至上
- 每个功能都要问：用户如何自定义？
- 默认设置要智能，但用户必须能覆盖
- 记住用户选择，下次自动应用

### 2. 多语言优先
- 所有文案必须支持i18n
- 开发时先用英文，再翻译
- 支持语言：中文、英文、日文（后续扩展）

### 3. 渐进式个性化
- 基础设置：首次启动引导
- 高级设置：后续逐步开放
- 不强迫用户一次性配置所有

---

## 🌍 多语言系统

### 架构
```
src/
├── i18n/
│   ├── index.ts          # i18n初始化
│   ├── locales/
│   │   ├── en.json       # 英文
│   │   ├── zh.json       # 中文
│   │   └── ja.json       # 日文
│   └── types.ts          # 类型定义
```

### 实现方案

**KnowForge (Node.js)**:
```javascript
// i18n.js
const i18n = {
  current: 'zh',
  locales: {},
  
  load(locale) {
    this.locales[locale] = require(`./locales/${locale}.json`);
  },
  
  t(key, ...args) {
    const text = this.locales[this.current]?.[key] || key;
    return args.length ? text.replace(/%s/g, () => args.shift()) : text;
  },
  
  setLocale(locale) {
    if (!this.locales[locale]) this.load(locale);
    this.current = locale;
  }
};

module.exports = i18n;
```

**CodeForge (VSCode)**:
```typescript
// i18n.ts
import * as vscode from 'vscode';

const messages: { [key: string]: { [key: string]: string } } = {
  en: {
    'cmd.generateCode': 'Generate Code',
    'cmd.explainCode': 'Explain Code',
    'msg.noApiKey': 'Please configure OpenAI API Key',
    // ...
  },
  zh: {
    'cmd.generateCode': '生成代码',
    'cmd.explainCode': '解释代码',
    'msg.noApiKey': '请配置OpenAI API Key',
    // ...
  }
};

export function t(key: string): string {
  const locale = vscode.env.language;
  const lang = locale.startsWith('zh') ? 'zh' : 'en';
  return messages[lang]?.[key] || messages['en'][key] || key;
}
```

### 语言文件示例

**en.json**:
```json
{
  "app.name": "KnowForge",
  "app.tagline": "Your second brain",
  "nav.allNotes": "All Notes",
  "nav.tags": "Tags",
  "nav.starred": "Starred",
  "btn.newNote": "New Note",
  "btn.save": "Save",
  "btn.cancel": "Cancel",
  "msg.noteCreated": "Note created successfully",
  "msg.noteUpdated": "Note updated successfully",
  "msg.noteDeleted": "Note deleted successfully",
  "error.noTitle": "Title is required",
  "error.noContent": "Content is required"
}
```

**zh.json**:
```json
{
  "app.name": "KnowForge",
  "app.tagline": "你的第二大脑",
  "nav.allNotes": "所有笔记",
  "nav.tags": "标签",
  "nav.starred": "收藏",
  "btn.newNote": "新建笔记",
  "btn.save": "保存",
  "btn.cancel": "取消",
  "msg.noteCreated": "笔记创建成功",
  "msg.noteUpdated": "笔记更新成功",
  "msg.noteDeleted": "笔记删除成功",
  "error.noTitle": "标题不能为空",
  "error.noContent": "内容不能为空"
}
```

---

## ⚙️ 用户配置系统

### 配置层级

```
系统默认 → 用户配置 → 项目配置 → 临时覆盖
   ↑___________________________________↓
```

### 配置项设计

**KnowForge 配置**:
```json
{
  "language": "zh",
  "theme": "dark",
  "fontSize": 14,
  "fontFamily": "system-ui",
  "sidebarWidth": 240,
  "autoSave": true,
  "autoSaveInterval": 30000,
  "backupCount": 10,
  "searchHighlight": true,
  "markdownPreview": true,
  "shortcuts": {
    "newNote": "Ctrl+N",
    "search": "Ctrl+K",
    "save": "Ctrl+S"
  }
}
```

**CodeForge 配置**:
```json
{
  "language": "zh",
  "apiKey": "",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2000,
  "cacheEnabled": true,
  "cacheDuration": 3600,
  "showStats": true,
  "autoFormat": true,
  "shortcuts": {
    "generateCode": "Ctrl+Shift+G",
    "explainCode": "Ctrl+Shift+E",
    "reviewCode": "Ctrl+Shift+R",
    "refactorCode": "Ctrl+Shift+F"
  }
}
```

### 配置文件存储

**KnowForge**:
```javascript
// config.js
const path = require('path');
const fs = require('fs');

const CONFIG_FILE = path.join(__dirname, 'user-config.json');

const defaultConfig = {
  language: 'zh',
  theme: 'dark',
  fontSize: 14,
  // ...
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...defaultConfig, ...userConfig };
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return defaultConfig;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

module.exports = { loadConfig, saveConfig, defaultConfig };
```

**CodeForge**:
```typescript
// config.ts
import * as vscode from 'vscode';

const CONFIG_SECTION = 'codeforge';

export function getConfig<T>(key: string, defaultValue: T): T {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return config.get<T>(key, defaultValue);
}

export function setConfig<T>(key: string, value: T): Thenable<void> {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return config.update(key, value, true);
}
```

---

## 🎨 主题系统

### 主题配置
```json
{
  "theme": {
    "name": "dark",
    "colors": {
      "bg.primary": "#1a1a2e",
      "bg.secondary": "#16213e",
      "bg.tertiary": "#0f3460",
      "text.primary": "#ffffff",
      "text.secondary": "#94a3b8",
      "accent": "#667eea",
      "success": "#27c93f",
      "warning": "#ffbd2e",
      "error": "#ff5f56"
    }
  }
}
```

### CSS变量实现
```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #ffffff;
  --accent: #667eea;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a2e;
  --accent: #0066cc;
}
```

---

## 📱 首次启动引导

### 引导流程
```
1. 欢迎页
   → 介绍产品
   → 选择语言

2. 基础配置
   → 选择主题
   → 设置字体大小

3. 功能配置（可选）
   → API Key（CodeForge）
   → 快捷键设置

4. 完成
   → 开始使用
   → 显示教程
```

### 实现
```javascript
// onboarding.js
const i18n = require('./i18n');
const { saveConfig } = require('./config');

async function showOnboarding() {
  // 检查是否首次启动
  const config = loadConfig();
  if (!config.firstRun) return;
  
  // 1. 选择语言
  const language = await showLanguagePicker();
  i18n.setLocale(language);
  
  // 2. 选择主题
  const theme = await showThemePicker();
  
  // 3. 保存配置
  saveConfig({
    ...config,
    language,
    theme,
    firstRun: false
  });
  
  // 4. 显示欢迎
  showWelcomeMessage();
}
```

---

## 🔧 设置界面

### KnowForge 设置页
```html
<div class="settings-page">
  <h1 data-i18n="settings.title">Settings</h1>
  
  <section>
    <h2 data-i18n="settings.appearance">Appearance</h2>
    <label>
      <span data-i18n="settings.language">Language</span>
      <select id="language">
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="ja">日本語</option>
      </select>
    </label>
    <label>
      <span data-i18n="settings.theme">Theme</span>
      <select id="theme">
        <option value="dark" data-i18n="theme.dark">Dark</option>
        <option value="light" data-i18n="theme.light">Light</option>
      </select>
    </label>
  </section>
  
  <section>
    <h2 data-i18n="settings.editor">Editor</h2>
    <label>
      <span data-i18n="settings.fontSize">Font Size</span>
      <input type="number" id="fontSize" min="10" max="24" value="14">
    </label>
  </section>
</div>
```

---

## 📋 实施清单

### KnowForge
- [ ] 添加 i18n 模块
- [ ] 创建 en.json / zh.json
- [ ] 添加 config.js
- [ ] 创建设置页面
- [ ] 添加首次启动引导
- [ ] 主题切换功能

### CodeForge
- [ ] 添加 i18n.ts
- [ ] 翻译所有命令和消息
- [ ] 添加配置项到 package.json
- [ ] 创建设置面板
- [ ] 添加首次使用引导

### 文档
- [ ] 多语言开发指南
- [ ] 配置项说明文档

---

**核心准则确认**：
✅ 所有文案支持多语言
✅ 用户配置可持久化
✅ 主题可切换
✅ 首次启动引导
✅ 设置界面友好

**这是所有后续设计的基石。**