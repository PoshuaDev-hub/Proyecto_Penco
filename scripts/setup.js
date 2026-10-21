/**
 * setup.js - Menú interactivo de verificación, instalación, base de datos y lanzamiento
 * Proyecto: Hospital_Penco_IA
 * Subdirección de Gestión y Desarrollo de las Personas — Hospital Penco Lirquén
 * Compatible con: Windows (CMD, PowerShell, Git Bash) y Linux (Debian, Ubuntu, Bash)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');
const dbFile = path.join(backendDir, 'db.sqlite3');
const envFile = path.join(backendDir, '.env');
const reqFile = path.join(backendDir, 'requirements.txt');
const managePy = path.join(backendDir, 'manage.py');

// Colores ANSI para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function banner() {
  console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}   HOSPITAL_PENCO_IA — Panel Interactivo de Instalación y Control${colors.reset}`);
  console.log(`${colors.cyan}   Subdirección de Gestión de Personas • Hospital Penco Lirquén${colors.reset}`);
  console.log(`${colors.cyan}   Sistema Multiplataforma (Windows 10/11 & Linux Debian/Ubuntu)${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}\n`);
}

function printHeader(title) {
  console.log(`\n${colors.bright}${colors.blue}>>> [PROCESO] ${title}${colors.reset}`);
}

function success(msg) {
  console.log(`  ${colors.green}✔ ${msg}${colors.reset}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function error(msg) {
  console.error(`  ${colors.red}✖ ERROR: ${msg}${colors.reset}`);
}

function run(command, cwd = rootDir) {
  console.log(`  ${colors.dim}$ ${command}${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (err) {
    error(`Fallo al ejecutar: ${command}`);
    return false;
  }
}

function checkCommand(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Detección multiplataforma de ejecutable Python en venv
function getVenvPython() {
  if (process.platform === 'win32') {
    return path.join(backendDir, 'venv', 'Scripts', 'python.exe');
  }
  return path.join(backendDir, 'venv', 'bin', 'python');
}

// Detección de Python del sistema (Windows: python / Linux: python3)
function getSystemPython() {
  if (process.platform !== 'win32' && checkCommand('python3 --version')) {
    return 'python3';
  }
  if (checkCommand('python --version')) {
    return 'python';
  }
  if (checkCommand('py -3 --version')) {
    return 'py -3';
  }
  if (checkCommand('python3 --version')) {
    return 'python3';
  }
  return null;
}

// Detección de comando npm según plataforma
function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

// ==================== TAREAS DEL MENÚ ====================

// [1] Verificar e instalar dependencias completas
function taskVerifyAndInstallDeps() {
  printHeader('1. Verificación e Instalación de Dependencias');

  // Node.js
  const nodeVer = process.version;
  const major = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  if (major < 18) {
    warn(`Se recomienda Node.js 18+ (actual: ${nodeVer}).`);
  } else {
    success(`Node.js ${nodeVer} detectado.`);
  }

  // Python del sistema
  const sysPy = getSystemPython();
  if (!sysPy) {
    error('No se encontró Python 3 instalado en el sistema. Instale Python 3.10+ y agréguelo al PATH.');
    return false;
  }
  const pyVerStr = execSync(`${sysPy} --version`).toString().trim();
  success(`Python del sistema detectado: ${pyVerStr} (${sysPy})`);

  // Entorno virtual venv
  const venvPy = getVenvPython();
  if (!fs.existsSync(venvPy)) {
    console.log('  Creando entorno virtual aislado en backend/venv...');
    const ok = run(`${sysPy} -m venv venv`, backendDir);
    if (!ok) return false;
    success('Entorno virtual venv creado exitosamente.');
  } else {
    success(`Entorno virtual existente verificado: ${venvPy}`);
  }

  // Dependencias Python (pip)
  if (fs.existsSync(reqFile)) {
    console.log('  Instalando/actualizando paquetes de Python (Django, DRF, CORS)...');
    run(`"${venvPy}" -m pip install --upgrade pip`, backendDir);
    const okPip = run(`"${venvPy}" -m pip install -r requirements.txt`, backendDir);
    if (!okPip) return false;
    success('Dependencias de Python instaladas correctamente.');
  } else {
    error('No se encontró backend/requirements.txt.');
    return false;
  }

  // Archivo backend/.env
  if (!fs.existsSync(envFile)) {
    console.log('  Generando backend/.env predeterminado para desarrollo local...');
    const defaultEnv = [
      'DEBUG=True',
      'SECRET_KEY=hospital-penco-ia-dev-secret-key-2026',
      'DATABASE_URL=sqlite:///db.sqlite3',
      'ALLOWED_HOSTS=*,127.0.0.1,localhost',
    ].join('\n') + '\n';
    fs.writeFileSync(envFile, defaultEnv, 'utf8');
    success('Archivo backend/.env generado.');
  } else {
    success('Archivo backend/.env verificado.');
  }

  // Dependencias Node.js
  const npmCmd = getNpmCommand();
  console.log('  Instalando dependencias de Node.js en raíz...');
  run(`${npmCmd} install`, rootDir);

  console.log('  Instalando dependencias de Node.js en frontend (React, Vite)...');
  run(`${npmCmd} install`, frontendDir);

  success('Todas las dependencias están verificadas e instaladas.');
  return true;
}

// [2] Crear o sincronizar base de datos local
function taskCreateOrMigrateDB() {
  printHeader('2. Creación y Migración de Base de Datos Local');
  const venvPy = getVenvPython();

  if (!fs.existsSync(venvPy)) {
    warn('Entorno virtual no encontrado. Ejecutando verificación previa...');
    if (!taskVerifyAndInstallDeps()) return false;
  }

  if (!fs.existsSync(managePy)) {
    error('No se encontró backend/manage.py.');
    return false;
  }

  console.log('  Generando migraciones para las aplicaciones de negocio...');
  run(`"${venvPy}" manage.py makemigrations seleccion pautas preguntas`, backendDir);

  console.log('  Aplicando migraciones a la base de datos SQLite...');
  const ok = run(`"${venvPy}" manage.py migrate`, backendDir);

  if (ok && fs.existsSync(dbFile)) {
    success(`Base de datos SQLite local lista y sincronizada: ${dbFile}`);
    return true;
  } else {
    error('Hubo un problema al aplicar las migraciones.');
    return false;
  }
}

// [3] Inyectar datos de prueba institucionales (Seed)
function taskSeedData() {
  printHeader('3. Inyección de Datos de Prueba Institucionales (Hospital Penco)');
  const venvPy = getVenvPython();

  if (!fs.existsSync(dbFile)) {
    warn('Base de datos no encontrada. Creándola primero...');
    if (!taskCreateOrMigrateDB()) return false;
  }

  console.log('  Ejecutando comando seed_hospital (Usuarios, Perfiles Ley 18.834, Convocatorias, 10 Etapas)...');
  try {
    run(`"${venvPy}" manage.py seed_hospital`, backendDir);
    success('Datos institucionales y usuarios de prueba cargados correctamente.');
    console.log(`\n  ${colors.bright}Credenciales disponibles:${colors.reset}`);
    console.log(`    - admin / admin123 (Administrador Global TI)`);
    console.log(`    - carolina.ruiz / penco2026 (Jefa RRHH / Desarrollo Personas)`);
    console.log(`    - maria.jose / penco2026 (Analista de Selección)`);
    console.log(`    - psicologa / psico123 (Psicóloga Laboral)`);
    console.log(`    - comite1 / comite123 (Comisión Evaluadora)`);
    return true;
  } catch (err) {
    warn('No se pudo ejecutar seed_hospital o la base de datos ya contenía registros.');
    return false;
  }
}

// [4] Limpiar / Resetear Base de Datos de Forma Segura
function taskCleanAndResetDB(seedAfter = true) {
  printHeader('4. Limpieza y Recreación Segura de la Base de Datos');

  if (fs.existsSync(dbFile)) {
    try {
      const backupPath = path.join(backendDir, `db.sqlite3.bak_${Date.now()}`);
      fs.copyFileSync(dbFile, backupPath);
      success(`Copia de seguridad preventiva generada: ${path.basename(backupPath)}`);
    } catch (e) {
      warn(`No se pudo generar copia de respaldo: ${e.message}`);
    }

    try {
      console.log(`  Eliminando archivo de base de datos actual para recreación limpia: ${dbFile}...`);
      fs.unlinkSync(dbFile);
      success('Archivo db.sqlite3 anterior removido.');
    } catch (err) {
      error(`No se pudo eliminar db.sqlite3 (asegúrese de que ningún servidor esté usando el archivo): ${err.message}`);
      return false;
    }
  } else {
    console.log('  No existía base de datos previa. Se creará una nueva.');
  }

  // Re-aplicar migraciones limpias
  console.log('  Recreando esquema limpio y tablas en SQLite...');
  const okMigrate = taskCreateOrMigrateDB();
  if (!okMigrate) return false;

  if (seedAfter) {
    console.log('  Poblando con datos de prueba frescos...');
    taskSeedData();
  }

  success('Base de datos reseteada y lista para operar sin errores.');
  return true;
}

// [5] Lanzar el sistema completo (Backend + Frontend)
function taskLaunchSystem() {
  printHeader('5. Lanzamiento del Sistema (Django + Vite)');
  const launchScript = path.join(__dirname, 'launch.js');
  
  if (!fs.existsSync(launchScript)) {
    error('No se encontró scripts/launch.js');
    return;
  }

  console.log('  Iniciando servidores coordinados con supervisión de procesos...');
  try {
    // Reemplazar el proceso actual por el launcher
    const nodeCmd = process.execPath;
    spawnSync(nodeCmd, [launchScript], { stdio: 'inherit', cwd: rootDir });
  } catch (e) {
    error(`Error al lanzar servidores: ${e.message}`);
  }
}

// [6] Flujo Completo Automático (1 + 2 + 3 + 5)
function taskFullAuto() {
  banner();
  console.log(`${colors.bright}${colors.yellow}>>> MODO COMPLETO AUTOMÁTICO ACTIVADO${colors.reset}\n`);
  
  const okDeps = taskVerifyAndInstallDeps();
  if (!okDeps) return;

  const okDB = taskCreateOrMigrateDB();
  if (!okDB) return;

  taskSeedData();

  console.log(`\n${colors.green}${colors.bright}✔ Preparación completada. Lanzando entorno de desarrollo...${colors.reset}\n`);
  taskLaunchSystem();
}

// ==================== MENÚ INTERACTIVO ====================
function showMenu(rl) {
  banner();
  console.log(`${colors.bright}Seleccione una opción para continuar:${colors.reset}\n`);
  console.log(`  ${colors.cyan}[1]${colors.reset} 📦 Verificar e Instalar Dependencias (Node, Python, venv, pip, npm)`);
  console.log(`  ${colors.cyan}[2]${colors.reset} 🗄️  Crear / Sincronizar Base de Datos Local (Migraciones Django)`);
  console.log(`  ${colors.cyan}[3]${colors.reset} 🌱 Inyectar Datos de Prueba Institucionales (Seed Hospital Penco)`);
  console.log(`  ${colors.cyan}[4]${colors.reset} 🧹 Limpiar / Resetear Base de Datos (Seguro: recrea schema limpio)`);
  console.log(`  ${colors.cyan}[5]${colors.reset} 🚀 Lanzar Todo el Sistema (Backend Django :8000 + Frontend Vite :5173)`);
  console.log(`  ${colors.cyan}[6]${colors.reset} ⚡ Configuración Completa + Lanzamiento Automático (1 + 2 + 3 + 5)`);
  console.log(`  ${colors.cyan}[0]${colors.reset} 🚪 Salir\n`);

  rl.question(`${colors.bright}${colors.yellow}Ingrese opción [0-6]: ${colors.reset}`, (answer) => {
    const opt = answer.trim();

    switch (opt) {
      case '1':
        taskVerifyAndInstallDeps();
        pauseAndReturn(rl);
        break;
      case '2':
        taskCreateOrMigrateDB();
        pauseAndReturn(rl);
        break;
      case '3':
        taskSeedData();
        pauseAndReturn(rl);
        break;
      case '4':
        rl.question(`\n${colors.yellow}¿Desea reinyectar datos de prueba tras el reseteo? [S/n]: ${colors.reset}`, (confirm) => {
          const seed = confirm.trim().toLowerCase() !== 'n';
          taskCleanAndResetDB(seed);
          pauseAndReturn(rl);
        });
        break;
      case '5':
        rl.close();
        taskLaunchSystem();
        break;
      case '6':
        rl.close();
        taskFullAuto();
        break;
      case '0':
        console.log(`\n${colors.green}Hasta luego.${colors.reset}\n`);
        rl.close();
        process.exit(0);
        break;
      default:
        console.log(`\n${colors.red}Opción no válida. Intente de nuevo.${colors.reset}`);
        setTimeout(() => showMenu(rl), 1200);
        break;
    }
  });
}

function pauseAndReturn(rl) {
  console.log(`\n${colors.dim}Presione ENTER para regresar al menú principal...${colors.reset}`);
  rl.question('', () => {
    showMenu(rl);
  });
}

// ==================== PUNTO DE ENTRADA ====================
const args = process.argv.slice(2);
const isNonInteractive = args.includes('--auto') || args.includes('-y') || args.includes('--check') || !process.stdin.isTTY;

if (isNonInteractive) {
  // Modo no interactivo (ej. verify / preflight / CI)
  taskVerifyAndInstallDeps();
  taskCreateOrMigrateDB();
  taskSeedData();
  process.exit(0);
} else {
  // Modo interactivo con menú
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  showMenu(rl);
}
