// i18n.ts - Internationalization for CodeForge
import * as vscode from 'vscode';

interface Messages {
  [key: string]: { [key: string]: string };
}

const messages: Messages = {
  en: {
    // Commands
    'cmd.generateCode': 'Generate Code',
    'cmd.explainCode': 'Explain Code',
    'cmd.reviewCode': 'Review Code',
    'cmd.refactorCode': 'Refactor Code',
    'cmd.viewStats': 'View Statistics',
    
    // Messages
    'msg.welcome': 'CodeForge is ready! You\'ve used {0} requests.',
    'msg.codeGenerated': 'Code generated! ({0} tokens)',
    'msg.fromCache': 'Code inserted from cache',
    'msg.noApiKey': 'Please configure OpenAI API Key',
    'msg.noEditor': 'No active editor',
    'msg.noSelection': 'Please select some code',
    'msg.noInput': 'Please enter a description',
    'msg.inputTooShort': 'Please enter a more detailed description',
    'msg.codeTooLong': 'Selected code is too long. Processing first 5000 characters.',
    
    // Errors
    'error.apiKeyInvalid': 'Invalid API Key format. Should start with "sk-"',
    'error.requestFailed': 'Request failed: {0}',
    'error.timeout': 'Request timeout',
    'error.parseFailed': 'Failed to parse API response',
    'error.cacheFailed': 'Cache operation failed',
    
    // Progress
    'progress.generating': 'Generating code...',
    'progress.analyzing': 'Analyzing code...',
    'progress.reviewing': 'Reviewing code...',
    'progress.refactoring': 'Refactoring code...',
    
    // UI
    'ui.statsTitle': 'CodeForge Statistics',
    'ui.totalRequests': 'Total Requests',
    'ui.totalTokens': 'Total Tokens',
    'ui.commandUsage': 'Command Usage',
    'ui.lastUsed': 'Last used',
    
    // Settings
    'settings.apiKey': 'OpenAI API Key',
    'settings.model': 'AI Model',
    'settings.temperature': 'Temperature',
    'settings.cacheEnabled': 'Enable Response Cache',
    'settings.cacheDuration': 'Cache Duration (seconds)',
    'settings.showStats': 'Show Statistics on Startup',
    'settings.autoFormat': 'Auto Format Generated Code',
    
    // Refactor types
    'refactor.readability': 'Improve readability',
    'refactor.performance': 'Optimize performance',
    'refactor.errorHandling': 'Add error handling',
    'refactor.modernize': 'Modernize syntax'
  },
  
  zh: {
    // Commands
    'cmd.generateCode': '生成代码',
    'cmd.explainCode': '解释代码',
    'cmd.reviewCode': '审查代码',
    'cmd.refactorCode': '重构代码',
    'cmd.viewStats': '查看统计',
    
    // Messages
    'msg.welcome': 'CodeForge 已就绪！你已使用 {0} 次请求。',
    'msg.codeGenerated': '代码生成成功！（{0} tokens）',
    'msg.fromCache': '已从缓存插入代码',
    'msg.noApiKey': '请配置 OpenAI API Key',
    'msg.noEditor': '没有活动的编辑器',
    'msg.noSelection': '请选择一些代码',
    'msg.noInput': '请输入描述',
    'msg.inputTooShort': '请输入更详细的描述',
    'msg.codeTooLong': '选中的代码太长。只处理前5000个字符。',
    
    // Errors
    'error.apiKeyInvalid': 'API Key 格式无效。应以 "sk-" 开头',
    'error.requestFailed': '请求失败：{0}',
    'error.timeout': '请求超时',
    'error.parseFailed': '解析 API 响应失败',
    'error.cacheFailed': '缓存操作失败',
    
    // Progress
    'progress.generating': '正在生成代码...',
    'progress.analyzing': '正在分析代码...',
    'progress.reviewing': '正在审查代码...',
    'progress.refactoring': '正在重构代码...',
    
    // UI
    'ui.statsTitle': 'CodeForge 统计',
    'ui.totalRequests': '总请求数',
    'ui.totalTokens': '总 Token 数',
    'ui.commandUsage': '命令使用',
    'ui.lastUsed': '最后使用',
    
    // Settings
    'settings.apiKey': 'OpenAI API Key',
    'settings.model': 'AI 模型',
    'settings.temperature': '温度',
    'settings.cacheEnabled': '启用响应缓存',
    'settings.cacheDuration': '缓存时长（秒）',
    'settings.showStats': '启动时显示统计',
    'settings.autoFormat': '自动格式化生成的代码',
    
    // Refactor types
    'refactor.readability': '提高可读性',
    'refactor.performance': '优化性能',
    'refactor.errorHandling': '添加错误处理',
    'refactor.modernize': '现代化语法'
  }
};

export function t(key: string, ...args: string[]): string {
  const locale = vscode.env.language;
  const lang = locale.startsWith('zh') ? 'zh' : 'en';
  
  let text = messages[lang]?.[key] || messages['en']?.[key] || key;
  
  // Replace placeholders
  args.forEach((arg, index) => {
    text = text.replace(`{${index}}`, arg);
  });
  
  return text;
}

export function getAvailableLanguages(): string[] {
  return Object.keys(messages);
}

export function getCurrentLanguage(): string {
  const locale = vscode.env.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
}