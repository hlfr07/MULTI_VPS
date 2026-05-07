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
    await ensurePackage('zstd', 'zstd', platform);

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
    // npm start -- admin admin123 --> process.argv = ['node', 'init.js', 'admin', 'admin123']
    // npm start -- admin admin123 --nube --> process.argv = ['node', 'init.js', 'admin', 'admin123', '--nube']
    // npm start -- admin admin123 --terminal --> process.argv = ['node', 'init.js', 'admin', 'admin123', '--terminal']
    const args = process.argv.slice(2); // Obtener argumentos después de 'node init.js'
    const hasNubeFlag = process.argv.includes('--nube');
    const hasTerminalFlag = process.argv.includes('--terminal');
    const hasNgrokFlag = process.argv.includes('--ngrok');
    const ngrokFlagIndex = args.indexOf('--ngrok');
    const ngrokAuthToken = ngrokFlagIndex >= 0 ? args[ngrokFlagIndex + 1] : null;
    const hasNgrokAuthToken = Boolean(ngrokAuthToken && !ngrokAuthToken.startsWith('--'));
    const hasInstallOnlyFlag = process.argv.includes('--install-only') || process.argv.includes('--solo-instalar') || process.argv.includes('--no-start');
    const hasNoInstallFlag = process.argv.includes('--no-install') || process.argv.includes('--skip-install') || process.argv.includes('--fast');

    if (args.length >= 2) {
        // Credenciales pasadas como argumentos
        user = args[0];
        pass = args[1];
        console.log(`✅ Usando credenciales pasadas por argumentos`);
        console.log(`👤 Usuario: ${user}`);
        if (hasNubeFlag) {
            console.log(`☁️  Flag --nube detectado. Se iniciará cloudflared con túneles`);
        }
        if (hasTerminalFlag) {
            console.log(`🔧 Flag --terminal detectado. Solo se instalará cloudflared`);
        }
        if (hasNgrokFlag) {
            console.log(`🔑 Flag --ngrok detectado. Se configurará el authtoken de ngrok`);
        }
        if (hasInstallOnlyFlag) {
            console.log(`📦 Flag --install-only detectado. Se instalará todo pero NO se iniciarán servicios (backend/frontend/cloudflared)`);
        }
        if (hasNoInstallFlag) {
            console.log(`⚡ Flag --no-install detectado. Se OMITIRÁN las instalaciones/builds largos para acelerar la ejecución`);
        }
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

    const spinnerBackend = createSpinner(hasInstallOnlyFlag ? '⚙️ Installing backend dependencies (no start)...' : '⚙️ Starting backend server...');
    if (hasNoInstallFlag) {
        spinnerBackend.stop();
        console.log('⏭️ Backend install/build skipped due to --no-install');
    } else if (!hasInstallOnlyFlag) {
        await execAsync(`
    cd ${projectPath}/server/ && npm ci && screen -dmS node-backend-3001 npm run start
    `);
        spinnerBackend.stop();
        console.log('✅ Backend started');
    } else {
        await execAsync(`cd ${projectPath}/server/ && npm ci`);
        spinnerBackend.stop();
        console.log('✅ Backend dependencies installed (start skipped)');
    }

    const spinnerFrontend = createSpinner(hasInstallOnlyFlag ? '🎨 Installing frontend dependencies/build (no start)...' : '🎨 Building frontend...');
    if (hasNoInstallFlag) {
        spinnerFrontend.stop();
        console.log('⏭️ Frontend install/build skipped due to --no-install');
    } else if (!hasInstallOnlyFlag) {
        await execAsync(`
    cd ${projectPath}/panel/ && npm ci && npm run build && \
screen -dmS node-frontend-4200 bash -c "echo y | npx http-server dist/panel2/browser -p 4200"
    `);
        spinnerFrontend.stop();
        console.log('✅ Frontend started');
    } else {
        await execAsync(`cd ${projectPath}/panel/ && npm ci && npm run build`);
        spinnerFrontend.stop();
        console.log('✅ Frontend built (server start skipped)');
    }

    function quoteForShell(value) {
        return `'${String(value).replace(/'/g, `'"'"'`)}'`;
    }

    // Manejar flag --terminal / --ngrok (instalar ngrok y opcionalmente configurar token)
    if (hasTerminalFlag || hasNgrokFlag) {
        console.log('\n🔧 Configurando ngrok...');
        
        const spinnerNgrokCheck = createSpinner('🔍 Verificando ngrok...');
        let ngrokInstalled = false;
        
        try {
            await execAsync('command -v ngrok');
            ngrokInstalled = true;
            spinnerNgrokCheck.stop();
            console.log('✅ ngrok ya está instalado');
        } catch {
            spinnerNgrokCheck.stop();
            console.log('📦 ngrok no encontrado, instalando...');
            
            const spinnerInstallNgrok = createSpinner('📦 Instalando ngrok...');
            try {
                await execAsync(`
                    cd /tmp && \
                    wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz && \
                    tar -xzf ngrok-v3-stable-linux-amd64.tgz && \
                    chmod +x ngrok && \
                    mv ngrok /usr/local/bin/ngrok && \
                    chmod +x /usr/local/bin/ngrok && \
                    rm -f ngrok-v3-stable-linux-amd64.tgz
                `);
                ngrokInstalled = true;
                spinnerInstallNgrok.stop();
                console.log('✅ ngrok instalado exitosamente');
            } catch (error) {
                spinnerInstallNgrok.stop();
                console.error(`❌ Error instalando ngrok: ${error.message}`);
            }
        }
        
        if (ngrokInstalled) {
            console.log('✅ ngrok listo. Podrás tunelizar manualmente cuando lo necesites');
        }

        if (hasNgrokFlag) {
            if (!hasNgrokAuthToken) {
                console.log('⚠️  Flag --ngrok detectado pero no se recibió un token válido');
            } else {
                const spinnerNgrokToken = createSpinner('🔑 Configurando authtoken de ngrok...');
                try {
                    await execAsync(`ngrok config add-authtoken ${quoteForShell(ngrokAuthToken)}`);
                    spinnerNgrokToken.stop();
                    console.log('✅ Authtoken de ngrok configurado');
                } catch (error) {
                    spinnerNgrokToken.stop();
                    console.error(`❌ Error configurando authtoken de ngrok: ${error.message}`);
                }
            }
        }
    }

    // Manejar flag --nube (instalar cloudflared y ejecutar túneles)
    if (hasNubeFlag) {
        console.log('\n☁️  Configurando cloudflared...');
        
        const spinnerCloudflaredCheck = createSpinner('🔍 Verificando cloudflared...');
        let cloudflaredInstalled = false;
        
        try {
            await execAsync('command -v cloudflared');
            cloudflaredInstalled = true;
            spinnerCloudflaredCheck.stop();
            console.log('✅ cloudflared ya está instalado');
        } catch {
            spinnerCloudflaredCheck.stop();
            console.log('📦 cloudflared no encontrado, instalando...');
            
            const spinnerInstallCf = createSpinner('📦 Instalando cloudflared...');
            try {
                if (platform === 'termux') {
                    await execAsync('pkg install -y cloudflared');
                } else if (platform === 'ubuntu' || platform === 'rhel') {
                    await execAsync(`
                        curl -L --output /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && \
                        chmod +x /tmp/cloudflared && \
                        mv /tmp/cloudflared /usr/local/bin/cloudflared
                    `);
                }
                cloudflaredInstalled = true;
                spinnerInstallCf.stop();
                console.log('✅ cloudflared instalado exitosamente');
            } catch (error) {
                spinnerInstallCf.stop();
                console.error(`❌ Error instalando cloudflared: ${error.message}`);
            }
        }

        // Instalar dependencias de cloudflared y opcionalmente iniciar túneles
        if (cloudflaredInstalled) {
            const spinnerCloudflared = createSpinner(hasInstallOnlyFlag ? '☁️ Installing cloudflared deps (no start)...' : '☁️ Iniciando túneles cloudflared...');
            if (hasNoInstallFlag) {
                spinnerCloudflared.stop();
                console.log('⏭️ Cloudflared install/start skipped due to --no-install');
            } else if (!hasInstallOnlyFlag) {
                await execAsync(`
    cd ${projectPath}/cloudflared/ && npm ci && screen -dmS cloud npm start
    `);
                spinnerCloudflared.stop();
                console.log('✅ Cloudflared túneles iniciados');
            } else {
                await execAsync(`cd ${projectPath}/cloudflared/ && npm ci`);
                spinnerCloudflared.stop();
                console.log('✅ Cloudflared dependencies installed (start skipped)');
            }
        }
    }

    /* ==========================
       Instalación opcional: Ollama
       ========================== */
    async function ensureOllama(platform) {
        if (platform !== 'ubuntu' && platform !== 'rhel') {
            console.log('⏭️  Ollama install only supported on Debian/Ubuntu/RHEL - skipping');
            return;
        }

        try {
            console.log('\n📦 Installing Ollama...');
            const spinnerOllama = createSpinner('📦 Installing Ollama...');

            // Ejecutar script oficial de Ollama
            await execAsync('curl -fsSL https://ollama.com/install.sh | sh');
            spinnerOllama.stop();
            console.log('✅ Ollama instalado (si el script es compatible con esta plataforma)');
        } catch (error) {
            console.log(`⚠️  No se pudo instalar Ollama: ${error.message}`);
        }
    }

    async function startOllamaScreen() {
        try {
            await execAsync('command -v ollama');
        } catch {
            console.log('⏭️ Ollama no está instalado, no se iniciará la sesión screen ollama');
            return;
        }

        try {
            const spinnerOllamaStart = createSpinner('🧠 Starting ollama in screen...');
            await execAsync(`
screen -dmS ollama bash -c "OLLAMA_HOST=0.0.0.0:11434 OLLAMA_CONTEXT_LENGTH=131072 ollama serve"
            `);
            spinnerOllamaStart.stop();
            console.log('✅ Ollama corriendo en screen con nombre ollama');
        } catch (error) {
            console.log(`⚠️  No se pudo iniciar Ollama en screen: ${error.message}`);
        }
    }

    // Ejecutar instalación de Ollama (no bloqueante para flags de start)
    await ensureOllama(platform);

    // Iniciar Ollama al final, si está disponible
    await startOllamaScreen();

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
