#!/usr/bin/env node

const { program } = require('commander');
const DeployForge = require('../lib/index');

const pkg = require('../package.json');

program
  .name('deployforge')
  .description('One-click deployment tool for developers')
  .version(pkg.version);

// Deploy command
program
  .command('deploy')
  .description('Deploy current project')
  .option('-p, --platform <platform>', 'Deployment platform (vercel, netlify, github-pages)')
  .option('-s, --server <server>', 'SSH server for deployment')
  .option('-c, --config <config>', 'Config file path')
  .action(async (options) => {
    try {
      const df = new DeployForge();
      await df.deploy(options);
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize deployment configuration')
  .option('-l, --language <lang>', 'Language (zh/en)', 'zh')
  .action(async (options) => {
    try {
      // Set language in env for DeployForge to pick up
      process.env.DEPLOYFORGE_LANG = options.language;
      const df = new DeployForge();
      await df.init();
    } catch (error) {
      console.error('❌ Init failed:', error.message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage deployment configurations')
  .option('-l, --list', 'List all configurations')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .action(async (options) => {
    try {
      const df = new DeployForge();
      await df.config(options);
    } catch (error) {
      console.error('❌ Config failed:', error.message);
      process.exit(1);
    }
  });

// List platforms command
program
  .command('platforms')
  .description('List supported deployment platforms')
  .option('-l, --language <lang>', 'Language (zh/en)', 'zh')
  .action((options) => {
    const messages = {
      zh: {
        title: '📦 支持的平台',
        cloud: '云平台',
        china: '国内云',
        self: '自建服务器'
      },
      en: {
        title: '📦 Supported Platforms',
        cloud: 'Cloud Platforms',
        china: 'China Cloud',
        self: 'Self-hosted'
      }
    };
    
    const t = messages[options.language] || messages.zh;
    
    console.log(t.title + '\n');
    
    console.log(t.cloud + ':');
    console.log('  • vercel      - Vercel (Frontend)');
    console.log('  • netlify     - Netlify (Static)');
    console.log('  • railway     - Railway (Fullstack)');
    console.log('  • render      - Render (Fullstack)');
    console.log('  • github-pages - GitHub Pages (Free)');
    
    console.log('\n' + t.china + ':');
    console.log('  • aliyun-oss  - 阿里云 OSS');
    console.log('  • tencent-cos - 腾讯云 COS');
    console.log('  • upyun       - 又拍云');
    
    console.log('\n' + t.self + ':');
    console.log('  • ssh         - SSH Deployment');
    console.log('  • docker      - Docker Deployment');
    console.log('  • pm2         - PM2 Process Management');
  });

program.parse();