import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Obtener la ruta del directorio actual del script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// La ruta del proyecto es el directorio padre de server-init
const PROJECT_ROOT = path.resolve(__dirname, '..');

/* =========================
   Platform Detection
========================= */

// Detectar si estamos en Termux o Ubuntu/Linux
async function detectPlatform() {
    // Verificar si estamos en Termux
    try {
        await execAsync('command -v pkg');
        // Verificar también la variable PREFIX típica de Termux
        if (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) {
            return 'termux';
        }
        // Doble verificación con termux-info
        try {
            await execAsync('command -v termux-info');
            return 'termux';
        } catch {
            // pkg existe pero no es Termux
        }
    } catch {
        // pkg no existe
    }

    // Verificar si estamos en Ubuntu/Debian
    try {
        await execAsync('command -v apt-get');
        // Verificar si es Ubuntu específicamente
        try {
            const { stdout } = await execAsync('cat /etc/os-release');
            if (stdout.includes('Ubuntu') || stdout.includes('Debian')) {
                return 'ubuntu';
            }
        } catch { }
        return 'ubuntu'; // Asumimos Ubuntu si tiene apt-get
    } catch {
        // No es Ubuntu/Debian
    }

    // Verificar otras distribuciones Linux
    try {
        await execAsync('command -v yum');
        return 'rhel'; // Red Hat, CentOS, Fedora
    } catch { }

    return 'unknown';
}

// Obtener el comando de instalación según la plataforma
function getInstallCommand(platform) {
    switch (platform) {
        case 'termux':
            return 'pkg install -y';
        case 'ubuntu':
            return 'apt-get install -y';
        case 'rhel':
            return 'yum install -y';
        default:
            throw new Error('❌ Plataforma no soportada');
    }
}

// Mapeo de paquetes entre plataformas
function getPackageName(pkg, platform) {
    const packageMap = {
        'curl': { termux: 'curl', ubuntu: 'curl', rhel: 'curl' },
        'tar': { termux: 'tar', ubuntu: 'tar', rhel: 'tar' },
        'screen': { termux: 'screen', ubuntu: 'screen', rhel: 'screen' },
        'ttyd': { termux: 'ttyd', ubuntu: 'ttyd', rhel: 'ttyd' },
        'xsel': { termux: null, ubuntu: 'xsel', rhel: 'xsel' },
        'proot-distro': { termux: 'proot-distro', ubuntu: null, rhel: null },
        'termux-api': { termux: 'termux-api', ubuntu: null, rhel: null },
        'nodejs': { termux: 'nodejs', ubuntu: 'nodejs', rhel: 'nodejs' },
        'npm': { termux: 'nodejs', ubuntu: 'npm', rhel: 'npm' },
        'git': { termux: 'git', ubuntu: 'git', rhel: 'git' },
    };

    return packageMap[pkg] ? packageMap[pkg][platform] : pkg;
}

/* =========================
   Helpers
========================= */

// Spinner para mostrar actividad durante operaciones largas
function createSpinner(text) {
    const frames = ['◜ ', '◠ ', '◝ ', '◞ ', '◡ ', '◟ '];
    let index = 0;
    let isActive = true;

    const interval = setInterval(() => {
        if (isActive) {
            process.stdout.write(`\r${text} ${frames[index]}`);
            index = (index + 1) % frames.length;
        }
    }, 120);

    return {
        stop: () => {
            isActive = false;
            clearInterval(interval);
            process.stdout.write(`\r${text} ✓\n`);
        }
    };
}

async function ensureCommand(cmd, installCmd) {
    try {
        await execAsync(`command -v ${cmd}`);
        console.log(`✅ ${cmd} already installed`);
    } catch {
        const spinner = createSpinner(`📦 Installing ${cmd}...`);
        await execAsync(installCmd);
        spinner.stop();
    }
}

// Versión mejorada que detecta la plataforma automáticamente
async function ensurePackage(cmd, packageName, platform) {
    const installBase = getInstallCommand(platform);
    const actualPackage = getPackageName(packageName, platform);

    if (!actualPackage) {
        console.log(`⏭️  ${packageName} not available/needed on ${platform}, skipping...`);
        return false;
    }

    try {
        await execAsync(`command -v ${cmd}`);
        console.log(`✅ ${cmd} already installed`);
        return true;
    } catch {
        const spinner = createSpinner(`📦 Installing ${actualPackage}...`);
        try {
            // En Ubuntu, actualizar cache primero si es necesario
            if (platform === 'ubuntu') {
                await execAsync('apt-get update -qq');
            }
            await execAsync(`${installBase} ${actualPackage}`);
            spinner.stop();
            return true;
        } catch (error) {
            spinner.stop();
            console.log(`⚠️  Could not install ${actualPackage}: ${error.message}`);
            return false;
        }
    }
}

// Preguntar en consola TERMINAL INTERACTIVE
function ask(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Preguntar en consola con input oculto (password)
function askHidden() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        rl.stdoutMuted = true;
        rl._writeToOutput = function (stringToWrite) {
            if (rl.stdoutMuted) {
                rl.output.write('*');
            } else {
                rl.output.write(stringToWrite);
            }
        };

        rl.question('', (answer) => {
            rl.close();
            console.log(); // salto de línea
            resolve(answer.trim());
        });
    });
}


/* =========================
   INIT
========================= */

export async function initServer() {
    console.log('🚀 Bootstrapping DroidVPS environment...\n');

    /* 0️⃣ Detectar plataforma */
    const spinnerPlatform = createSpinner('🔍 Detecting platform...');
    const platform = await detectPlatform();
    spinnerPlatform.stop();
    
    if (platform === 'unknown') {
        throw new Error('❌ Plataforma no soportada. Se requiere Termux o Ubuntu/Debian');
    }
    
    console.log(`✅ Platform detected: ${platform.toUpperCase()}`);

    /* 1️⃣ Dependencias base */
    await ensurePackage('curl', 'curl', platform);
    await ensurePackage('tar', 'tar', platform);
    await ensurePackage('ttyd', 'ttyd', platform);

    // Solo para Ubuntu: xsel (necesario para clipboard en serve)
    if (platform === 'ubuntu' || platform === 'rhel') {
        await ensurePackage('xsel', 'xsel', platform);
    }

    // Solo para Termux: proot-distro y termux-api
    if (platform === 'termux') {
        await ensurePackage('proot-distro', 'proot-distro', platform);
        await ensurePackage('termux-battery-status', 'termux-api', platform);

        /* 3️⃣ Verificar rootfs (solo Termux) */
        let hasRootfs = true;
        const spinnerRootfs = createSpinner('🔍 Checking rootfs...');
        try {
            await execAsync('ls $PREFIX/var/lib/proot-distro/installed-rootfs');
            spinnerRootfs.stop();
            console.log('✅ rootfs found');
        } catch {
            spinnerRootfs.stop();
            hasRootfs = false;
        }

        /* 4️⃣ Instalar alpine si no hay nada */
        if (!hasRootfs) {
            const spinnerAlpine = createSpinner('📦 Installing base alpine...');
            await execAsync('proot-distro install alpine');
            spinnerAlpine.stop();
        } else {
            console.log('✅ installed-rootfs exists');
        }

        /* 5️⃣ Descargar debian.tar.gz */
        const spinnerDownload = createSpinner('⬇️ Downloading debian.tar.gz...');
        await execAsync(`
        cd $PREFIX/var/lib/proot-distro/installed-rootfs || exit 1

        if [ ! -f debian.tar.gz ]; then
          curl -L --silent -O \
          https://github.com/hlfr07/DroidVPS/releases/download/v1.0.1/debian.tar.gz
        else
          echo "✅ debian.tar.gz already exists"
        fi
      `);
        spinnerDownload.stop();

        /* 6️⃣ Extraer debian */
        const spinnerExtract = createSpinner('📦 Extracting debian.tar.gz...');
        await execAsync(`
        cd $PREFIX/var/lib/proot-distro/installed-rootfs || exit 1

        if [ ! -d debian ]; then
          tar -xzf debian.tar.gz
        else
          echo "✅ debian already extracted"
        fi
      `);
        spinnerExtract.stop();

        /* 7️⃣ Verificar termux-api app */
        const spinnerAPI = createSpinner('🔋 Testing termux-battery-status...');
        try {
            await execAsync('termux-battery-status');
            spinnerAPI.stop();
            console.log('🔋 termux-battery-status working');
        } catch {
            spinnerAPI.stop();
            console.log('⚠️ termux-api installed, but Termux:API app may be missing');
        }
    } else {
        console.log('ℹ️  Running on Ubuntu/Linux - skipping Termux-specific setup (proot-distro, termux-api)');
    }

    /* 8️⃣ Credenciales */
    console.log('\n🔐 Web Terminal protection');

    let user, pass;

    // Verificar si se pasaron credenciales como argumentos
    // npm start admin admin123 --> process.argv = ['node', 'init.js', 'admin', 'admin123']
    const args = process.argv.slice(2); // Obtener argumentos después de 'node init.js'

    if (args.length >= 2) {
        // Credenciales pasadas como argumentos
        user = args[0];
        pass = args[1];
        console.log(`✅ Usando credenciales pasadas por argumentos`);
        console.log(`👤 Usuario: ${user}`);
    } else {
        // Pedir credenciales interactivamente
        user = await ask('👤 Usuario ttyd: ');

        if (!user) {
            throw new Error('❌ El usuario no puede estar vacío');
        }

        console.log('\n🔑 Por favor ingrese su password. Se recomienda mínimo 6 caracteres incluyendo mayúsculas, minúsculas, números y símbolos');
        const pass1 = await askHidden();

        console.log('🔁 Confirme su password');
        const pass2 = await askHidden();

        if (!pass1 || !pass2) {
            throw new Error('❌ El password no puede estar vacío');
        }

        if (pass1 !== pass2) {
            throw new Error('❌ Los passwords no coinciden');
        }

        pass = pass1;
    }

    if (!user || !pass) {
        throw new Error('❌ El usuario y password no pueden estar vacíos');
    }

    //Vamos a cifrar usuario y password y gyardaremos en un archivo .mycredentials
    const spinnerCred = createSpinner('🔐 Saving credentials...');
    const credentials = Buffer.from(`${user}:${pass}`).toString('base64');
    const homeDir = process.env.HOME || os.homedir();
    await execAsync(`echo ${credentials} > ${homeDir}/.mycredentials`);
    spinnerCred.stop();
    console.log('✅ Credenciales guardadas');

    //Antes de todo haremos por seacaso un kill de ttyd
    const spinnerKillTtyd = createSpinner('🛑 Stopping previous ttyd...');
    await execAsync('pkill ttyd || echo "ttyd no estaba corriendo"');
    spinnerKillTtyd.stop();
    console.log('✅ ttyd stopped');

    /* 9️⃣ Levantar ttyd */
    console.log('\n🖥 Starting ttyd on port 7681...');

    spawn('ttyd', [
        '--writable',
        '-p', '7681',
        '-i', '127.0.0.1',
        'bash', '-l'
    ], {
        cwd: homeDir,
        detached: true,
        stdio: 'ignore'
    }).unref();

    console.log('\n🎉 DroidVPS environment READY');
    console.log('🌐 Web terminal: http://localhost:7681');

    //Despues de iniciar todo creamos 2 sesiones screen 
    //Primero verificamos si screen esta instalado
    await ensurePackage('screen', 'screen', platform);

    //Para seguridad ejecutamos esto pkill -9 screen y luego esto rm -rf ~/.screen/*
    console.log('\n🧹 Limpiando sesiones screen antiguas');
    const spinnerKillScreen = createSpinner('🛑 Stopping screen sessions...');
    await execAsync('pkill -9 screen || echo "screen no estaba corriendo"');
    spinnerKillScreen.stop();

    // En Ubuntu, ejecutar screen -wipe para limpiar sesiones huérfanas
    if (platform === 'ubuntu' || platform === 'rhel') {
        const spinnerWipeScreen = createSpinner('🧹 Wiping dead screen sessions...');
        await execAsync('screen -wipe || echo "No dead screens to wipe"');
        spinnerWipeScreen.stop();
    }

    const spinnerCleanScreen = createSpinner('🧹 Cleaning screen files...');
    await execAsync(`rm -rf ${homeDir}/.screen/*`);
    spinnerCleanScreen.stop();
    console.log('✅ Sesiones screen antiguas limpiadas');

    // Usar la ruta del proyecto detectada automáticamente
    const projectPath = PROJECT_ROOT;
    console.log(`📁 Project path: ${projectPath}`);

    //Luego creamos las sesiones screen para el panel
    console.log('💡 Creando sesiones screen para el panel');

    const spinnerBackend = createSpinner('⚙️ Starting backend server...');
    await execAsync(`
    cd ${projectPath}/server/ && npm ci && screen -dmS node-backend-3001 npm run start
    `);
    spinnerBackend.stop();
    console.log('✅ Backend started');

    const spinnerFrontend = createSpinner('🎨 Building frontend...');
    await execAsync(`
    cd ${projectPath}/panel/ && npm ci && npm run build && \
screen -dmS node-frontend-4200 bash -c "echo y | npx http-server dist/panel2/browser -p 4200"
    `);
    spinnerFrontend.stop();
    console.log('✅ Frontend started');

    const localIP = getLocalIP();

    // Barra de progreso de 10 segundos para asegurar que todo esté levantado
    console.log('\n⏳ Esperando a que todos los servicios estén listos...\n');

    let progress = 0;
    const startTime = Date.now();
    const duration = 10000; // 10 segundos

    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        progress = Math.min((elapsed / duration) * 100, 100);

        const filledBars = Math.floor(progress / 5);
        const emptyBars = 20 - filledBars;
        const progressBar = '[' + '█'.repeat(filledBars) + '░'.repeat(emptyBars) + ']';
        process.stdout.write(`\r${progressBar} ${Math.floor(progress)}%`);

        if (progress >= 100) {
            clearInterval(progressInterval);
            process.stdout.write('\n✓ Todos los servicios están listos!\n');
        }
    }, 100);

    // Esperar los 10 segundos
    await new Promise(resolve => setTimeout(resolve, duration));

    // Esperar 1 segundo adicional antes de mostrar el mensaje final
    await new Promise(resolve => setTimeout(resolve, 1000));

    //Obtenemos el ip local
    console.log(`\n🚀 ¡Todo listo! Accede al panel en http://${localIP}:4200`);
}

function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}
