const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../user-config.json');

const defaultConfig = {
  // Language
  language: 'zh',
  
  // Appearance
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  sidebarWidth: 240,
  
  // Editor
  autoSave: true,
  autoSaveInterval: 30000,
  markdownPreview: true,
  searchHighlight: true,
  
  // Backup
  backupCount: 10,
  
  // First run
  firstRun: true,
  
  // Shortcuts
  shortcuts: {
    newNote: 'Ctrl+N',
    search: 'Ctrl+K',
    save: 'Ctrl+S'
  }
};

class Config {
  constructor() {
    this.config = this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return { ...defaultConfig };
  }

  save() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  get(key, defaultValue) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let target = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[keys[keys.length - 1]] = value;
    return this.save();
  }

  getAll() {
    return { ...this.config };
  }

  reset() {
    this.config = { ...defaultConfig };
    return this.save();
  }
}

// Singleton instance
const config = new Config();

module.exports = config;