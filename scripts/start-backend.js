const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');
const python = process.platform === 'win32'
  ? path.join(backend, 'venv', 'Scripts', 'python.exe')
  : path.join(backend, 'venv', 'bin', 'python');

const child = spawn(python, ['manage.py', 'runserver', '0.0.0.0:8000'], {
  cwd: backend,
  stdio: 'inherit',
  shell: false,
});
child.on('exit', (code) => process.exit(code ?? 0));
