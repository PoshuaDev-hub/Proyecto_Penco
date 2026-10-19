const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const child = spawn(npm, ['run', 'dev', '--', '--host'], {
  cwd: frontend,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
