#!/usr/bin/env node

const { program } = require('commander');

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
      const DeployForge = require('../lib/index');
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
  .action(async () => {
    try {
      const df = new DeployForge();
      await df.init();
    } catch (error) {
      console.error(chalk.red('❌ Init failed:'), error.message);
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
      console.error(chalk.red('❌ Config failed:'), error.message);
      process.exit(1);
    }
  });

// List platforms command
program
  .command('platforms')
  .description('List supported deployment platforms')
  .action(() => {
    console.log('📦 Supported Platforms:\n');
    
    console.log('Cloud Platforms:');
    console.log('  • vercel      - Vercel (Frontend)');
    console.log('  • netlify     - Netlify (Static)');
    console.log('  • railway     - Railway (Fullstack)');
    console.log('  • render      - Render (Fullstack)');
    console.log('  • github-pages - GitHub Pages (Free)');
    
    console.log('\nChina Cloud:');
    console.log('  • aliyun-oss  - 阿里云 OSS');
    console.log('  • tencent-cos - 腾讯云 COS');
    console.log('  • upyun       - 又拍云');
    
    console.log('\nSelf-hosted:');
    console.log('  • ssh         - SSH Deployment');
    console.log('  • docker      - Docker Deployment');
    console.log('  • pm2         - PM2 Process Management');
  });

program.parse();