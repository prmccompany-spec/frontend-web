#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

// Check if command exists
function commandExists(cmd) {
  try {
    execSync(`where ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check prerequisites
function checkPrerequisites() {
  log.header('=== PRMCF Project Setup ===');
  log.info('Checking prerequisites...\n');

  const checks = {
    'Node.js': 'node',
    'npm': 'npm',
    'Flutter': 'flutter',
  };

  let allInstalled = true;
  const results = {};

  for (const [name, cmd] of Object.entries(checks)) {
    if (commandExists(cmd)) {
      try {
        const version = execSync(`${cmd} --version`, { encoding: 'utf8' }).trim().split('\n')[0];
        log.success(`${name} - ${version}`);
        results[name] = true;
      } catch {
        log.success(`${name} is installed`);
        results[name] = true;
      }
    } else {
      log.warn(`${name} is not installed`);
      results[name] = false;
      if (name !== 'Flutter') {
        allInstalled = false;
      }
    }
  }

  return { allInstalled, flutterInstalled: results['Flutter'] };
}

// Check .env files
function checkEnvFiles() {
  const dirs = ['frontend-web', 'backend', 'mobile-app'];

  log.info('Checking environment files...\n');

  for (const dir of dirs) {
    const envPath = path.join(dir, '.env');

    if (fs.existsSync(envPath)) {
      log.success(`${dir}/.env found`);
    } else {
      log.warn(`${dir}/.env not found - create it manually`);
    }
  }
}

// Install dependencies
async function installDependencies() {
  const projects = ['frontend-web', 'backend'];

  log.header('Installing Dependencies');

  for (const project of projects) {
    const projectPath = path.join(__dirname, project);
    
    if (fs.existsSync(projectPath)) {
      log.info(`Installing ${project} dependencies...\n`);
      
      try {
        execSync('npm install', {
          cwd: projectPath,
          stdio: 'inherit',
        });
        log.success(`${project} dependencies installed\n`);
      } catch (error) {
        log.error(`Failed to install ${project} dependencies`);
        throw error;
      }
    }
  }

  checkEnvFiles();
  log.success('Setup complete!\n');
}

// Run a service
function runService(serviceName, command, cwd) {
  log.header(`Starting ${serviceName}...`);
  log.info(`Running: ${command}\n`);

  const child = spawn('npm', ['run', command], {
    cwd: path.join(__dirname, cwd),
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    log.error(`Failed to start ${serviceName}: ${err.message}`);
  });
}

// Interactive menu
function showMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  log.header('What would you like to do?');
  console.log('1) Install all dependencies');
  console.log('2) Setup frontend only');
  console.log('3) Setup backend only');
  console.log('4) Run frontend (dev)');
  console.log('5) Run backend (dev)');
  console.log('6) Run both in sequence');
  console.log('7) View setup instructions');
  console.log('8) Exit');
  console.log();

  rl.question('Enter your choice (1-8): ', async (answer) => {
    rl.close();

    try {
      switch (answer.trim()) {
        case '1':
          await installDependencies();
          showMenu();
          break;

        case '2':
          await installDependencies();
          showMenu();
          break;

        case '3':
          const backendPath = path.join(__dirname, 'backend');
          log.header('Setting up Backend...');
          execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
          checkEnvFiles();
          log.success('Backend setup complete!');
          showMenu();
          break;

        case '4':
          runService('Frontend', 'dev', 'frontend-web');
          break;

        case '5':
          runService('Backend', 'dev', 'backend');
          break;

        case '6':
          log.header('Starting Both Services');
          log.info('Starting frontend on http://localhost:5173');
          log.info('Starting backend on http://localhost:3000\n');
          
          const frontend = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, 'frontend-web'),
            stdio: 'pipe',
            shell: true,
          });

          const backend = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'pipe',
            shell: true,
          });

          frontend.stdout.on('data', (data) => {
            console.log(`${colors.blue}[Frontend]${colors.reset} ${data}`);
          });

          backend.stdout.on('data', (data) => {
            console.log(`${colors.yellow}[Backend]${colors.reset} ${data}`);
          });

          frontend.stderr.on('data', (data) => {
            console.log(`${colors.blue}[Frontend Error]${colors.reset} ${data}`);
          });

          backend.stderr.on('data', (data) => {
            console.log(`${colors.yellow}[Backend Error]${colors.reset} ${data}`);
          });

          log.info('Press Ctrl+C to stop all services');
          break;

        case '7':
          log.header('Setup Instructions');
          console.log(`
${colors.bright}Option 1: Automated Setup${colors.reset}
  1. Ensure .env files exist in:
     - frontend-web/.env
     - backend/.env
     - mobile-app/.env
  2. Run: node setup.js
  3. Choose option 1 (Install all dependencies)
  4. Choose option 4 (Frontend) or 5 (Backend) to run

${colors.bright}Option 2: Manual Setup${colors.reset}
  # Install all
  npm install in both frontend-web/ and backend/

  # Run frontend (Terminal 1)
  cd frontend-web && npm run dev

  # Run backend (Terminal 2)
  cd backend && npm run dev

${colors.bright}Database Setup${colors.reset}
  See docs/DATABASE.md for complete database setup

${colors.bright}Mobile Setup${colors.reset}
  Install Flutter from https://flutter.dev/docs/get-started/install
  Then: cd mobile-app && flutter pub get && flutter run

${colors.bright}API Documentation${colors.reset}
  See docs/API.md for all API endpoints

${colors.bright}Test Credentials${colors.reset}
  Email: user@example.com
  Password: User@123
          `);
          showMenu();
          break;

        case '8':
          log.success('Goodbye!');
          process.exit(0);
          break;

        default:
          log.error('Invalid choice');
          showMenu();
      }
    } catch (error) {
      log.error(`Error: ${error.message}`);
      showMenu();
    }
  });
}

// Main
async function main() {
  try {
    const { allInstalled, flutterInstalled } = checkPrerequisites();

    if (!allInstalled) {
      log.error('Missing required prerequisites!');
      log.info('Please install Node.js and npm from https://nodejs.org/');
      process.exit(1);
    }

    if (!flutterInstalled) {
      log.warn('Flutter is not installed (required only for mobile app)');
    }

    console.log();
    showMenu();
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
