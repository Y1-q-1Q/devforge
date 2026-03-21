const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const CONFIG_FILE = path.join(process.cwd(), 'deployforge.json');

class DeployForge {
  constructor() {
    this.config = this.loadConfig();
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

    // Detect framework
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

    // Static site generators
    if (dependencies['astro']) {
      return { type: 'astro', buildCommand: 'npm run build', outputDir: 'dist' };
    }
    if (dependencies['gatsby']) {
      return { type: 'gatsby', buildCommand: 'npm run build', outputDir: 'public' };
    }
    if (dependencies['hexo']) {
      return { type: 'hexo', buildCommand: 'npm run build', outputDir: 'public' };
    }

    // Default to static
    return { type: 'static', buildCommand: '', outputDir: '.' };
  }

  async init() {
    console.log(chalk.blue('🚀 DeployForge Initialization\n'));

    const projectInfo = this.detectProjectType();
    console.log(chalk.gray(`Detected project type: ${projectInfo.type}`));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: path.basename(process.cwd())
      },
      {
        type: 'list',
        name: 'platform',
        message: 'Choose deployment platform:',
        choices: [
          { name: 'Vercel (Frontend)', value: 'vercel' },
          { name: 'Netlify (Static)', value: 'netlify' },
          { name: 'GitHub Pages (Free)', value: 'github-pages' },
          { name: 'Railway (Fullstack)', value: 'railway' },
          { name: 'SSH (Self-hosted)', value: 'ssh' },
          { name: 'Docker (Self-hosted)', value: 'docker' }
        ]
      },
      {
        type: 'input',
        name: 'buildCommand',
        message: 'Build command:',
        default: projectInfo.buildCommand || 'npm run build'
      },
      {
        type: 'input',
        name: 'outputDir',
        message: 'Output directory:',
        default: projectInfo.outputDir || 'dist'
      }
    ]);

    // Platform-specific config
    if (answers.platform === 'ssh') {
      const sshConfig = await inquirer.prompt([
        {
          type: 'input',
          name: 'host',
          message: 'SSH Host:',
          validate: input => input.length > 0 || 'Host is required'
        },
        {
          type: 'input',
          name: 'username',
          message: 'SSH Username:',
          default: 'root'
        },
        {
          type: 'input',
          name: 'port',
          message: 'SSH Port:',
          default: '22'
        },
        {
          type: 'input',
          name: 'deployPath',
          message: 'Remote deploy path:',
          default: '/var/www/html'
        }
      ]);
      answers.ssh = sshConfig;
    }

    const config = {
      name: answers.name,
      platform: answers.platform,
      buildCommand: answers.buildCommand,
      outputDir: answers.outputDir,
      ...answers
    };

    this.saveConfig(config);
    console.log(chalk.green('\n✅ Configuration saved to deployforge.json'));
    console.log(chalk.gray('\nRun "deployforge deploy" to deploy your project'));
  }

  async deploy(options) {
    const config = options.config ? JSON.parse(fs.readFileSync(options.config, 'utf8')) : this.config;
    
    if (!config.platform && !options.platform) {
      console.error(chalk.red('❌ No deployment platform configured'));
      console.log(chalk.gray('Run "deployforge init" first or use --platform option'));
      process.exit(1);
    }

    const platform = options.platform || config.platform;
    
    console.log(chalk.blue(`🚀 Deploying to ${platform}...\n`));

    // Build project
    if (config.buildCommand) {
      const spinner = ora('Building project...').start();
      try {
        execSync(config.buildCommand, { stdio: 'pipe' });
        spinner.succeed('Build completed');
      } catch (error) {
        spinner.fail('Build failed');
        throw error;
      }
    }

    // Deploy based on platform
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
  }

  async deployToVercel(config) {
    const spinner = ora('Deploying to Vercel...').start();
    
    try {
      // Check if vercel CLI is installed
      try {
        execSync('vercel --version', { stdio: 'pipe' });
      } catch {
        spinner.text = 'Installing Vercel CLI...';
        execSync('npm i -g vercel', { stdio: 'pipe' });
      }

      // Deploy
      execSync(`vercel --prod --yes`, { stdio: 'inherit' });
      spinner.succeed('Deployed to Vercel successfully');
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  async deployToNetlify(config) {
    const spinner = ora('Deploying to Netlify...').start();
    
    try {
      // Check if netlify CLI is installed
      try {
        execSync('netlify --version', { stdio: 'pipe' });
      } catch {
        spinner.text = 'Installing Netlify CLI...';
        execSync('npm i -g netlify-cli', { stdio: 'pipe' });
      }

      // Deploy
      execSync(`netlify deploy --prod --dir=${config.outputDir}`, { stdio: 'inherit' });
      spinner.succeed('Deployed to Netlify successfully');
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  async deployToGitHubPages(config) {
    const spinner = ora('Deploying to GitHub Pages...').start();
    
    try {
      // Check if gh-pages is installed
      try {
        execSync('npx gh-pages --version', { stdio: 'pipe' });
      } catch {
        spinner.text = 'Installing gh-pages...';
        execSync('npm i -D gh-pages', { stdio: 'pipe' });
      }

      // Deploy
      execSync(`npx gh-pages -d ${config.outputDir}`, { stdio: 'inherit' });
      spinner.succeed('Deployed to GitHub Pages successfully');
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  async deployToSSH(config, serverOverride) {
    const { NodeSSH } = require('node-ssh');
    const ssh = new NodeSSH();

    const server = serverOverride || config.ssh?.host;
    if (!server) {
      throw new Error('SSH server not configured');
    }

    const spinner = ora(`Deploying to ${server}...`).start();

    try {
      // Connect via SSH
      spinner.text = 'Connecting to server...';
      await ssh.connect({
        host: server,
        username: config.ssh?.username || 'root',
        port: config.ssh?.port || 22,
        privateKey: config.ssh?.privateKey || path.join(process.env.HOME || process.env.USERPROFILE, '.ssh/id_rsa')
      });

      // Create archive
      spinner.text = 'Creating deployment archive...';
      const archivePath = path.join(process.cwd(), 'deploy.zip');
      await this.createArchive(config.outputDir, archivePath);

      // Upload
      spinner.text = 'Uploading files...';
      const remotePath = config.ssh?.deployPath || '/var/www/html';
      await ssh.putFile(archivePath, `/tmp/deploy-${Date.now()}.zip`);

      // Extract and deploy
      spinner.text = 'Extracting files...';
      await ssh.execCommand(`cd ${remotePath} && unzip -o /tmp/deploy-*.zip && rm /tmp/deploy-*.zip`);

      // Cleanup
      fs.unlinkSync(archivePath);
      ssh.dispose();

      spinner.succeed('Deployed successfully via SSH');
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  async deployToDocker(config) {
    const spinner = ora('Building Docker image...').start();

    try {
      // Build image
      execSync('docker build -t deployforge-app .', { stdio: 'inherit' });
      spinner.succeed('Docker image built');

      // Run container
      spinner.start('Starting container...');
      execSync('docker run -d --name deployforge-app -p 3000:3000 deployforge-app', { stdio: 'inherit' });
      spinner.succeed('Container started');

      console.log(chalk.green('\n✅ Deployed with Docker'));
      console.log(chalk.gray('App running at: http://localhost:3000'));
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  createArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async config(options) {
    if (options.list) {
      console.log(chalk.blue('📋 Current Configuration:\n'));
      console.log(JSON.stringify(this.config, null, 2));
      return;
    }

    if (options.get) {
      const value = this.config[options.get];
      console.log(value !== undefined ? value : chalk.gray('(not set)'));
      return;
    }

    if (options.set) {
      const [key, value] = options.set.split('=');
      if (!key || value === undefined) {
        console.error(chalk.red('❌ Invalid format. Use: key=value'));
        process.exit(1);
      }
      this.config[key] = value;
      this.saveConfig(this.config);
      console.log(chalk.green(`✅ Set ${key} = ${value}`));
      return;
    }

    console.log(chalk.gray('Use --list, --get <key>, or --set <key=value>'));
  }
}

module.exports = DeployForge;