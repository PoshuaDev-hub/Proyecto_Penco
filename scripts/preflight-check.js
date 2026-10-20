/**
 * preflight-check.js - Verificacion de entorno previa al arranque.
 * Delega en scripts/setup.js para mantener una unica fuente de verdad
 * (evita divergencia entre dos implementaciones de preflight).
 */
const path = require('path');
const { spawnSync } = require('child_process');

const result = spawnSync(process.execPath, [path.join(__dirname, 'setup.js')], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
});

process.exit(result.status ?? 1);
