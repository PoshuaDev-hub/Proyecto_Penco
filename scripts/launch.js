/**
 * launch.js - Script de lanzamiento para Hospital_Penco_IA
 * Inicia de forma coordinada el servidor backend (Django) y el frontend (Vite)
 * Compatible con rutas con espacios (Windows/Debian).
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// Colores ANSI para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const venvPy = process.platform === 'win32'
  ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
  : path.join(backendDir, 'venv', 'bin', 'python');

const dbFile = path.join(backendDir, 'db.sqlite3');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Verificación rápida de instalación previa
if (!fs.existsSync(venvPy) || !fs.existsSync(dbFile) || !fs.existsSync(path.join(frontendDir, 'node_modules'))) {
  console.log(`\n${colors.yellow}${colors.bright}[AVISO] No se detecto la configuracion completa del sistema.${colors.reset}`);
  console.log(`${colors.yellow}Ejecutando configuracion inicial (setup)...${colors.reset}\n`);
  try {
    execSync(`node "${path.join(__dirname, 'setup.js')}"`, { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.error(`${colors.red}Error durante la configuracion inicial.${colors.reset}`);
    process.exit(1);
  }
}

// 2. Banner informativo
console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
console.log(`${colors.cyan}${colors.bright}   HOSPITAL_PENCO_IA - Servidores en Ejecucion${colors.reset}`);
console.log(`${colors.cyan}   Sistema de Gestion Psicolaboral Abreviada - Hospital Penco Lirquen${colors.reset}`);
console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}\n`);

console.log(`${colors.green}  ✔ Frontend Web (React + Vite):   ${colors.bright}http://localhost:5173${colors.reset}`);
console.log(`${colors.green}  ✔ Backend API (Django REST):     ${colors.bright}http://127.0.0.1:8000/api/${colors.reset}`);
console.log(`${colors.green}  ✔ Panel Admin Django:            ${colors.bright}http://127.0.0.1:8000/admin/${colors.reset}`);
console.log(`${colors.green}  ✔ Chequeo de Salud (Health):     ${colors.bright}http://127.0.0.1:8000/api/health/${colors.reset}\n`);
console.log(`  ${colors.yellow}Credenciales de prueba:${colors.reset}`);
console.log(`    Usuario: ${colors.cyan}admin${colors.reset}          | Clave: ${colors.cyan}admin123${colors.reset}`);
console.log(`    Usuario: ${colors.cyan}carolina.ruiz${colors.reset}  | Clave: ${colors.cyan}penco2026${colors.reset}\n`);
console.log(`${colors.magenta}Presione Ctrl + C en cualquier momento para detener ambos servicios.${colors.reset}`);
console.log(`${colors.cyan}------------------------------------------------------------------------${colors.reset}\n`);

// 3. Función auxiliar para matar árboles de procesos de manera limpia
function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch (e) {}
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch (e) {
      try { process.kill(pid, 'SIGTERM'); } catch (e2) {}
    }
  }
}

// 4. Iniciar Backend (Django) directamente con venvPy
// shell: false evita cualquier problema de separación por espacios en Windows
const backendProc = spawn(venvPy, ['manage.py', 'runserver', '127.0.0.1:8000'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, PYTHONUNBUFFERED: '1' }
});

// 5. Iniciar Frontend (Vite)
const frontendProc = spawn(npmCmd, ['run', 'dev', '--', '--host'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true
});

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${colors.cyan}[Hospital_Penco_IA] Deteniendo servidores...${colors.reset}`);
  
  if (backendProc && backendProc.pid) killTree(backendProc.pid);
  if (frontendProc && frontendProc.pid) killTree(frontendProc.pid);

  setTimeout(() => {
    console.log(`${colors.green}✔ Servidores finalizados limpiamente.${colors.reset}\n`);
    process.exit(exitCode);
  }, 500);
}

// Manejar señales de interrupción
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

backendProc.on('exit', (code) => {
  if (!isShuttingDown && code !== 0 && code !== null) {
    console.error(`\n${colors.red}[Hospital_Penco_IA] Backend finalizo con codigo ${code}.${colors.reset}`);
    shutdown(code);
  }
});

frontendProc.on('exit', (code) => {
  if (!isShuttingDown && code !== 0 && code !== null) {
    console.error(`\n${colors.red}[Hospital_Penco_IA] Frontend finalizo con codigo ${code}.${colors.reset}`);
    shutdown(code);
  }
});
