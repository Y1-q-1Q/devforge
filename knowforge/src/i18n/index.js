const fs = require('fs');
const path = require('path');

class I18n {
  constructor() {
    this.currentLocale = 'zh';
    this.locales = {};
    this.loadLocale('en');
    this.loadLocale('zh');
  }

  loadLocale(locale) {
    try {
      const filePath = path.join(__dirname, `${locale}.json`);
      if (fs.existsSync(filePath)) {
        this.locales[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Failed to load locale ${locale}:`, error);
    }
  }

  setLocale(locale) {
    if (this.locales[locale]) {
      this.currentLocale = locale;
    } else {
      console.warn(`Locale ${locale} not found, falling back to ${this.currentLocale}`);
    }
  }

  getLocale() {
    return this.currentLocale;
  }

  t(key, ...args) {
    const keys = key.split('.');
    let value = this.locales[this.currentLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    // Fallback to English
    if (value === undefined && this.currentLocale !== 'en') {
      value = this.locales['en'];
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }
    }
    
    // Fallback to key
    if (value === undefined) {
      value = key;
    }
    
    // Replace placeholders
    if (args.length > 0 && typeof value === 'string') {
      value = value.replace(/%s/g, () => args.shift() || '');
    }
    
    return value;
  }
}

// Singleton instance
const i18n = new I18n();

module.exports = i18n;