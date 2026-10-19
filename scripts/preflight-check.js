const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');
const frontend = path.join(root, 'frontend');
const seedFlag = process.argv.includes('--seed');

function log(msg) { console.log(`[preflight] ${msg}`); }
function run(cmd, opts = {}) {
  console.log(`[preflight] $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || root, ...opts });
}

function venvPython() {
  if (process.platform === 'win32') return path.join(backend, 'venv', 'Scripts', 'python.exe');
  return path.join(backend, 'venv', 'bin', 'python');
}

// 1. Node
log(`Node ${process.version}`);
// 2. Python
let pyCmd = 'python';
try { execSync('python --version', { stdio: 'ignore' }); }
catch (e) { try { execSync('python3 --version', { stdio: 'ignore' }); pyCmd = 'python3'; } catch (e2) { console.error('Python not found'); process.exit(1); } }
log(`Python command: ${pyCmd}`);

// 3. venv
const vp = venvPython();
if (!fs.existsSync(vp)) {
  log('Creating virtualenv...');
  run(`${pyCmd} -m venv venv`, { cwd: backend });
}
// 4. requirements
const req = path.join(backend, 'requirements.txt');
if (fs.existsSync(req)) {
  log('Installing backend requirements...');
  run(`"${vp}" -m pip install --upgrade pip`, { cwd: backend });
  run(`"${vp}" -m pip install -r requirements.txt`, { cwd: backend });
} else {
  log('No requirements.txt found, skipping pip install.');
}

// 5. .env
const envPath = path.join(backend, '.env');
if (!fs.existsSync(envPath)) {
  log('Creating default .env');
  fs.writeFileSync(envPath, 'DEBUG=True\nSECRET_KEY=dev-secret-key-change-me\nDATABASE_URL=sqlite:///db.sqlite3\nALLOWED_HOSTS=*\n');
}

// 6. manage.py check
const manage = path.join(backend, 'manage.py');
if (!fs.existsSync(manage)) {
  log('manage.py not found yet (Fase 1 skeleton). Skipping Django steps.');
  process.exit(0);
}

// 7. migrations
log('Running makemigrations...');
run(`"${vp}" manage.py makemigrations --noinput`, { cwd: backend });
log('Running migrate...');
run(`"${vp}" manage.py migrate --noinput`, { cwd: backend });

// 8. seed
if (seedFlag) {
  const seedCmd = `"${vp}" manage.py seed_hospital`;
  try { run(seedCmd, { cwd: backend }); }
  catch (e) { log('seed_hospital command not available yet; skipping.'); }
}

// 9. frontend deps
if (fs.existsSync(path.join(frontend, 'package.json'))) {
  log('Installing frontend deps...');
  run('npm install', { cwd: frontend });
}

log('Preflight OK.');
