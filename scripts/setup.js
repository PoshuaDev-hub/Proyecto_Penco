/**
 * setup.js - Script de verificacion e instalacion de dependencias y base de datos
 * Proyecto: Hospital_Penco_IA
 * Hospital Penco Lirquen - Servicio de Salud Talcahuano
 */

const { execSync, spawnSync } = require('child_process');
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
};

function banner() {
  console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}   HOSPITAL_PENCO_IA - Verificacion y Preparacion del Sistema${colors.reset}`);
  console.log(`${colors.cyan}   Subdireccion de Desarrollo de las Personas - Hospital Penco Lirquen${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}\n`);
}

function step(title) {
  console.log(`\n${colors.bright}${colors.blue}>>> [PASO] ${title}${colors.reset}`);
}

function success(msg) {
  console.log(`  ${colors.green}✔ ${msg}${colors.reset}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function fail(msg, err) {
  console.error(`\n  ${colors.red}✖ ERROR: ${msg}${colors.reset}`);
  if (err) console.error(err);
  process.exit(1);
}

function run(command, cwd = rootDir) {
  console.log(`  ${colors.yellow}$ ${command}${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (err) {
    fail(`Fallo al ejecutar: ${command}`, err);
  }
}

function getVenvPython() {
  if (process.platform === 'win32') {
    return path.join(backendDir, 'venv', 'Scripts', 'python.exe');
  }
  return path.join(backendDir, 'venv', 'bin', 'python');
}

function checkCommand(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// ==================== INICIO DEL SETUP ====================
banner();

// 1. Verificar Node.js
step('1. Verificando entorno Node.js');
console.log(`  Version detectada: ${process.version}`);
const nodeMajor = parseInt(process.version.replace('v', '').split('.')[0], 10);
if (nodeMajor < 18) {
  warn(`Se recomienda Node.js 18+ (actual: ${process.version}).`);
} else {
  success(`Node.js ${process.version} cumple con los requerimientos.`);
}

// 2. Verificar Python del sistema
step('2. Verificando interprete de Python');
let sysPython = 'python';
if (!checkCommand('python --version')) {
  if (checkCommand('python3 --version')) {
    sysPython = 'python3';
  } else {
    fail('No se encontro Python instalado en el sistema. Instale Python 3.10+ y agreguelo al PATH.');
  }
}
const pyVer = execSync(`${sysPython} --version`).toString().trim();
success(`${pyVer} detectado (${sysPython})`);

// 3. Crear entorno virtual (venv) si no existe
step('3. Configurando entorno virtual de Python (venv)');
const venvPy = getVenvPython();
if (!fs.existsSync(venvPy)) {
  console.log('  Creando entorno virtual en backend/venv...');
  run(`${sysPython} -m venv venv`, backendDir);
  success('Entorno virtual creado.');
} else {
  success('Entorno virtual existente reutilizado.');
}

// 4. Instalar dependencias de Python
step('4. Instalando/Actualizando dependencias de Backend (pip)');
const reqFile = path.join(backendDir, 'requirements.txt');
if (fs.existsSync(reqFile)) {
  run(`"${venvPy}" -m pip install --upgrade pip`, backendDir);
  run(`"${venvPy}" -m pip install -r requirements.txt`, backendDir);
  success('Dependencias de Django y librerias instaladas correctamente.');
} else {
  fail('No se encontro backend/requirements.txt.');
}

// 5. Configurar archivo .env de Django
step('5. Verificando configuracion de variables de entorno (.env)');
const envFile = path.join(backendDir, '.env');
if (!fs.existsSync(envFile)) {
  console.log('  Generando backend/.env por defecto para desarrollo...');
  const defaultEnv = [
    'DEBUG=True',
    'SECRET_KEY=hospital-penco-ia-dev-secret-key-2026',
    'DATABASE_URL=sqlite:///db.sqlite3',
    'ALLOWED_HOSTS=*,127.0.0.1,localhost',
  ].join('\n') + '\n';
  fs.writeFileSync(envFile, defaultEnv, 'utf8');
  success('Archivo backend/.env generado con configuracion para desarrollo.');
} else {
  success('Archivo backend/.env existente verificado.');
}

// 6. Instalar dependencias de Node.js (Raiz y Frontend)
step('6. Instalando paquetes Node.js del orquestador y frontend');
console.log('  Instalando paquetes en raiz (concurrently)...');
run('npm install', rootDir);

console.log('  Instalando paquetes en frontend/ (React, Vite)...');
run('npm install', frontendDir);
success('Paquetes de Node.js instalados.');

// 7. Base de datos: Migraciones Django
step('7. Creando tablas y aplicando migraciones de base de datos');
const managePy = path.join(backendDir, 'manage.py');
if (!fs.existsSync(managePy)) {
  fail('No se encontro backend/manage.py.');
}

console.log('  Generando migraciones para apps de negocio...');
run(`"${venvPy}" manage.py makemigrations seleccion pautas preguntas`, backendDir);

console.log('  Aplicando migraciones a la base de datos...');
run(`"${venvPy}" manage.py migrate`, backendDir);
success('Estructura de la base de datos creada y sincronizada.');

// 8. Carga de datos iniciales del Hospital Penco Lirquen
step('8. Poblando base de datos con datos institucionales (Seed)');
try {
  run(`"${venvPy}" manage.py seed_hospital`, backendDir);
  success('Datos del Hospital Penco Lirquen y usuarios cargados.');
} catch (e) {
  warn('No se pudo ejecutar seed_hospital directamente (o ya contenia datos).');
}

// Resumen final
console.log(`\n${colors.green}${colors.bright}========================================================================${colors.reset}`);
console.log(`${colors.green}${colors.bright}   ✔ SISTEMA HOSPITAL_PENCO_IA CONFIGURADO EXITOSAMENTE${colors.reset}`);
console.log(`${colors.green}   Base de datos lista, paquetes instalados y dependencias validadas.${colors.reset}`);
console.log(`${colors.green}${colors.bright}========================================================================${colors.reset}\n`);

console.log(`${colors.bright}Credenciales por defecto para desarrollo:${colors.reset}`);
console.log(`  - Administrador Django: ${colors.cyan}admin${colors.reset} / ${colors.cyan}admin123${colors.reset}`);
console.log(`  - Jefatura RRHH:        ${colors.cyan}carolina.ruiz${colors.reset} / ${colors.cyan}penco2026${colors.reset}\n`);

console.log(`${colors.bright}Para iniciar la aplicacion completa ejecuta:${colors.reset}`);
console.log(`  ${colors.yellow}npm start${colors.reset}  o  ${colors.yellow}npm run dev${colors.reset}\n`);
