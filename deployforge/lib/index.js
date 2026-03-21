const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const CONFIG_FILE = path.join(process.cwd(), 'deployforge.json');

// i18n messages
const messages = {
  zh: {
    'init.welcome': '🚀 DeployForge 初始化\n',
    'init.detected': '检测到项目类型',
    'init.saved': '\n✅ 配置已保存到 deployforge.json',
    'init.run': '\n运行 "deployforge deploy" 部署项目',
    'deploy.start': '🚀 开始部署到',
    'deploy.building': '正在构建项目...',
    'deploy.buildSuccess': '✅ 构建完成',
    'deploy.buildFail': '❌ 构建失败',
    'deploy.success': '✅ 部署成功',
    'deploy.fail': '❌ 部署失败',
    'error.noPlatform': '❌ 未配置部署平台',
    'error.runInit': '先运行 "deployforge init" 或使用 --platform 选项',
    'config.list': '📋 当前配置',
    'platform.title': '📦 支持的平台',
    'platform.cloud': '云平台',
    'platform.china': '国内云',
    'platform.self': '自建服务器'
  },
  en: {
    'init.welcome': '🚀 DeployForge Initialization\n',
    'init.detected': 'Detected project type',
    'init.saved': '\n✅ Configuration saved to deployforge.json',
    'init.run': '\nRun "deployforge deploy" to deploy your project',
    'deploy.start': '🚀 Deploying to',
    'deploy.building': 'Building project...',
    'deploy.buildSuccess': '✅ Build completed',
    'deploy.buildFail': '❌ Build failed',
    'deploy.success': '✅ Deployed successfully',
    'deploy.fail': '❌ Deployment failed',
    'error.noPlatform': '❌ No deployment platform configured',
    'error.runInit': 'Run "deployforge init" first or use --platform option',
    'config.list': '📋 Current Configuration',
    'platform.title': '📦 Supported Platforms',
    'platform.cloud': 'Cloud Platforms',
    'platform.china': 'China Cloud',
    'platform.self': 'Self-hosted'
  }
};

function t(key, lang = 'zh') {
  return messages[lang]?.[key] || messages['en']?.[key] || key;
}

class DeployForge {
  constructor() {
    this.config = this.loadConfig();
    this.lang = this.config.language || 'zh';
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Failed to load config:', error.message);
    }
    return {};
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error.message}`);
    }
  }

  detectProjectType() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { type: 'static', buildCommand: '', outputDir: '.' };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (dependencies['next']) {
      return { type: 'nextjs', buildCommand: 'npm run build', outputDir: 'out' };
    }
    if (dependencies['nuxt'] || dependencies['nuxt3']) {
      return { type: 'nuxt', buildCommand: 'npm run build', outputDir: 'dist' };
    }
    if (dependencies['react-scripts']) {
      return { type: 'react', buildCommand: 'npm run build', outputDir: 'build' };
    }
    if (dependencies['@vue/cli-service'] || dependencies['vite']) {
      return { type: 'vue', buildCommand: 'npm run build', outputDir: 'dist' };
    }
    if (dependencies['@angular/cli']) {
      return { type: 'angular', buildCommand: 'npm run build', outputDir: 'dist' };
    }
    if (dependencies['astro']) {
      return { type: 'astro', buildCommand: 'npm run build', outputDir: 'dist' };
    }
    if (dependencies['gatsby']) {
      return { type: 'gatsby', buildCommand: 'npm run build', outputDir: 'public' };
    }
    if (dependencies['hexo']) {
      return { type: 'hexo', buildCommand: 'npm run build', outputDir: 'public' };
    }

    return { type: 'static', buildCommand: '', outputDir: '.' };
  }

  async init() {
    console.log(t('init.welcome', this.lang));

    const projectInfo = this.detectProjectType();
    console.log(`${t('init.detected', this.lang)}: ${projectInfo.type}`);

    // Read package.json for default name
    let defaultName = path.basename(process.cwd());
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
      defaultName = pkg.name || defaultName;
    } catch (e) {}

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt, defaultValue = '') => {
      return new Promise(resolve => {
        rl.question(`${prompt} (${defaultValue}): `, answer => {
          resolve(answer.trim() || defaultValue);
        });
      });
    };

    const name = await question(this.lang === 'zh' ? '项目名称' : 'Project name', defaultName);
    
    console.log('\n' + (this.lang === 'zh' ? '选择部署平台:' : 'Choose deployment platform:'));
    console.log('1. Vercel (Frontend)');
    console.log('2. Netlify (Static)');
    console.log('3. GitHub Pages (Free)');
    console.log('4. Railway (Fullstack)');
    console.log('5. SSH (Self-hosted)');
    console.log('6. Docker (Self-hosted)');
    
    const platformChoice = await question(this.lang === 'zh' ? '平台编号' : 'Platform number', '1');
    const platforms = ['vercel', 'netlify', 'github-pages', 'railway', 'ssh', 'docker'];
    const platform = platforms[parseInt(platformChoice) - 1] || 'vercel';
    
    const buildCommand = await question(this.lang === 'zh' ? '构建命令' : 'Build command', projectInfo.buildCommand || 'npm run build');
    const outputDir = await question(this.lang === 'zh' ? '输出目录' : 'Output directory', projectInfo.outputDir || 'dist');

    const config = {
      name,
      platform,
      buildCommand,
      outputDir,
      language: this.lang
    };

    // SSH config
    if (platform === 'ssh') {
      config.ssh = {
        host: await question(this.lang === 'zh' ? 'SSH 主机' : 'SSH Host'),
        username: await question(this.lang === 'zh' ? 'SSH 用户名' : 'SSH Username', 'root'),
        port: parseInt(await question(this.lang === 'zh' ? 'SSH 端口' : 'SSH Port', '22')),
        deployPath: await question(this.lang === 'zh' ? '远程部署路径' : 'Remote deploy path', '/var/www/html')
      };
    }

    this.saveConfig(config);
    console.log(t('init.saved', this.lang));
    console.log(t('init.run', this.lang));
    
    rl.close();
  }

  async deploy(options) {
    const config = options.config ? JSON.parse(fs.readFileSync(options.config, 'utf8')) : this.config;
    
    if (!config.platform && !options.platform) {
      console.error(t('error.noPlatform', this.lang));
      console.log(t('error.runInit', this.lang));
      process.exit(1);
    }

    const platform = options.platform || config.platform;
    
    console.log(`${t('deploy.start', this.lang)} ${platform}...\n`);

    // Build project
    if (config.buildCommand) {
      console.log(t('deploy.building', this.lang));
      try {
        execSync(config.buildCommand, { stdio: 'inherit' });
        console.log(t('deploy.buildSuccess', this.lang));
      } catch (error) {
        console.error(t('deploy.buildFail', this.lang));
        throw error;
      }
    }

    // Deploy based on platform
    try {
      switch (platform) {
        case 'vercel':
          await this.deployToVercel(config);
          break;
        case 'netlify':
          await this.deployToNetlify(config);
          break;
        case 'github-pages':
          await this.deployToGitHubPages(config);
          break;
        case 'ssh':
          await this.deployToSSH(config, options.server);
          break;
        case 'docker':
          await this.deployToDocker(config);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      console.log(t('deploy.success', this.lang));
    } catch (error) {
      console.error(t('deploy.fail', this.lang));
      throw error;
    }
  }

  async deployToVercel(config) {
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch {
      console.log('Installing Vercel CLI...');
      execSync('npm i -g vercel', { stdio: 'inherit' });
    }
    execSync('vercel --prod --yes', { stdio: 'inherit' });
  }

  async deployToNetlify(config) {
    try {
      execSync('netlify --version', { stdio: 'pipe' });
    } catch {
      console.log('Installing Netlify CLI...');
      execSync('npm i -g netlify-cli', { stdio: 'inherit' });
    }
    execSync(`netlify deploy --prod --dir=${config.outputDir}`, { stdio: 'inherit' });
  }

  async deployToGitHubPages(config) {
    try {
      execSync('npx gh-pages --version', { stdio: 'pipe' });
    } catch {
      console.log('Installing gh-pages...');
      execSync('npm i -D gh-pages', { stdio: 'inherit' });
    }
    execSync(`npx gh-pages -d ${config.outputDir}`, { stdio: 'inherit' });
  }

  async deployToSSH(config, serverOverride) {
    console.log('SSH deployment requires manual setup. Please configure SSH keys.');
    console.log(`Deploy to: ${serverOverride || config.ssh?.host}`);
  }

  async deployToDocker(config) {
    console.log('Building Docker image...');
    execSync('docker build -t deployforge-app .', { stdio: 'inherit' });
    console.log('Starting container...');
    execSync('docker run -d --name deployforge-app -p 3000:3000 deployforge-app', { stdio: 'inherit' });
    console.log('App running at: http://localhost:3000');
  }

  async config(options) {
    if (options.list) {
      console.log(t('config.list', this.lang));
      console.log(JSON.stringify(this.config, null, 2));
      return;
    }

    if (options.get) {
      const value = this.config[options.get];
      console.log(value !== undefined ? value : '(not set)');
      return;
    }

    if (options.set) {
      const [key, value] = options.set.split('=');
      if (!key || value === undefined) {
        console.error('Invalid format. Use: key=value');
        process.exit(1);
      }
      this.config[key] = value;
      this.saveConfig(this.config);
      console.log(`Set ${key} = ${value}`);
      return;
    }

    console.log('Use --list, --get <key>, or --set <key=value>');
  }
}

module.exports = DeployForge;