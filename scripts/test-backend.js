/**
 * test-backend.js - Ejecuta la suite de pruebas de Django usando el interprete del venv.
 * Cross-platform (Windows / Debian) y sin depender de 'python' global.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '..', 'backend');
const python = process.platform === 'win32'
  ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
  : path.join(backendDir, 'venv', 'bin', 'python');

const result = spawnSync(python, ['manage.py', 'test', 'apps.seleccion', 'apps.pautas', 'apps.preguntas'], {
  cwd: backendDir,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
