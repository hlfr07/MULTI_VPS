import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Obtener la ruta del directorio actual del script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// La ruta del proyecto es el directorio padre de cloudflared
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
        stop: (message) => {
            isActive = false;
            clearInterval(interval);
            process.stdout.write(`\r${text} ✓\n`);
            if (message) console.log(message);
        }
    };
}

// Preguntar en consola
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

/* =========================
   Platform Detection
========================= */

async function detectPlatform() {
    // Verificar si estamos en Termux
    try {
        await execAsync('command -v pkg');
        if (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) {
            return 'termux';
        }
        try {
            await execAsync('command -v termux-info');
            return 'termux';
        } catch { }
    } catch { }

    // Verificar si estamos en Ubuntu/Debian
    try {
        await execAsync('command -v apt-get');
        return 'ubuntu';
    } catch { }

    // Verificar RHEL/CentOS/Fedora
    try {
        await execAsync('command -v yum');
        return 'rhel';
    } catch { }

    return 'unknown';
}

/* =========================
   Cloudflared Installation
========================= */

async function ensureCloudflared(platform) {
    try {
        await execAsync('command -v cloudflared');
        console.log('✅ cloudflared already installed');
        return true;
    } catch {
        console.log('📦 cloudflared not found, installing...');

        const spinner = createSpinner('📦 Installing cloudflared...');

        try {
            if (platform === 'termux') {
                // En Termux
                await execAsync('pkg install -y cloudflared');
            } else if (platform === 'ubuntu') {
                // En Ubuntu/Debian - descargar binario directamente
                await execAsync(`
                    curl -L --output /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && \
                    chmod +x /tmp/cloudflared && \
                    mv /tmp/cloudflared /usr/local/bin/cloudflared
                `);
            } else if (platform === 'rhel') {
                // En RHEL/CentOS
                await execAsync(`
                    curl -L --output /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && \
                    chmod +x /tmp/cloudflared && \
                    mv /tmp/cloudflared /usr/local/bin/cloudflared
                `);
            }
            spinner.stop();
            return true;
        } catch (error) {
            spinner.stop();
            console.error(`❌ Failed to install cloudflared: ${error.message}`);
            return false;
        }
    }
}

/* =========================
   Update Environment & Rebuild
========================= */

async function updateEnvironmentAndRebuild(tunnelUrl) {
    const environmentPath = path.join(PROJECT_ROOT, 'panel', 'src', 'environments', 'environment.ts');
    
    console.log('\n📝 Updating environment.ts with tunnel URL...');
    
    const environmentContent = `export const environment = {
  production: false,
  apiUrl: '${tunnelUrl}'
};
`;

    try {
        await fs.writeFile(environmentPath, environmentContent, 'utf-8');
        console.log('✅ environment.ts updated successfully');
    } catch (error) {
        console.error(`❌ Failed to update environment.ts: ${error.message}`);
        throw error;
    }

    // Rebuild frontend
    console.log('\n🔄 Rebuilding frontend with new API URL...');
    
    const spinnerBuild = createSpinner('🎨 Building frontend...');
    try {
        await execAsync(`cd ${PROJECT_ROOT}/panel && npm run build`);
        spinnerBuild.stop();
        console.log('✅ Frontend rebuilt successfully');
    } catch (error) {
        spinnerBuild.stop();
        console.error(`❌ Failed to rebuild frontend: ${error.message}`);
        throw error;
    }

    // Restart frontend server (kill old screen and start new one)
    console.log('\n🔄 Restarting frontend server...');
    
    const spinnerRestart = createSpinner('🔄 Restarting frontend...');
    try {
        // Kill existing frontend screen
        await execAsync('screen -S node-frontend-4200 -X quit || echo "No existing frontend screen"');
        
        // Start new frontend screen
        await execAsync(`cd ${PROJECT_ROOT}/panel && screen -dmS node-frontend-4200 bash -c "npx http-server dist/panel2/browser -p 4200"`);
        
        spinnerRestart.stop();
        console.log('✅ Frontend server restarted');
    } catch (error) {
        spinnerRestart.stop();
        console.error(`⚠️ Could not restart frontend: ${error.message}`);
    }
}

/* =========================
   Start Tunnel
========================= */

function createTunnel(targetUrl, name) {
    return new Promise((resolve, reject) => {
        const cloudflared = spawn('cloudflared', ['tunnel', '--url', targetUrl], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: true
        });

        // No esperar a que termine (corre en segundo plano)
        cloudflared.unref();

        let tunnelUrl = null;
        const urlRegex = /https:\/\/[a-zA-Z0-9\-]+\.trycloudflare\.com/;

        const processOutput = (data) => {
            const output = data.toString();
            
            // Buscar la URL del túnel
            const match = output.match(urlRegex);
            if (match && !tunnelUrl) {
                tunnelUrl = match[0];
                console.log(`✅ Tunnel ${name} created: ${tunnelUrl}`);
                resolve({ url: tunnelUrl, process: cloudflared });
            }

            // Mostrar logs relevantes
            if (output.includes('ERR')) {
                process.stdout.write(`[${name}] ${output}`);
            }
        };

        cloudflared.stdout.on('data', processOutput);
        cloudflared.stderr.on('data', processOutput);

        cloudflared.on('error', (error) => {
            reject(new Error(`Failed to start cloudflared for ${name}: ${error.message}`));
        });

        // Timeout de 30 segundos para obtener la URL
        setTimeout(() => {
            if (!tunnelUrl) {
                cloudflared.kill();
                reject(new Error(`Timeout waiting for ${name} tunnel URL`));
            }
        }, 30000);
    });
}

export async function startTunnel(backendUrl, frontendUrl) {
    console.log('🚀 Starting Cloudflared Tunnels...\n');

    // Detectar plataforma
    const spinnerPlatform = createSpinner('🔍 Detecting platform...');
    const platform = await detectPlatform();
    spinnerPlatform.stop();

    if (platform === 'unknown') {
        throw new Error('❌ Plataforma no soportada');
    }

    console.log(`✅ Platform detected: ${platform.toUpperCase()}`);

    // Asegurar que cloudflared está instalado
    const installed = await ensureCloudflared(platform);
    if (!installed) {
        throw new Error('❌ No se pudo instalar cloudflared');
    }

    // URLs por defecto
    if (!backendUrl) {
        backendUrl = await ask('🌐 URL del backend (ej: http://localhost:3001): ');
        if (!backendUrl) {
            backendUrl = 'http://localhost:3001';
            console.log(`ℹ️  Usando URL backend por defecto: ${backendUrl}`);
        }
    }

    if (!frontendUrl) {
        frontendUrl = await ask('🌐 URL del frontend (ej: http://localhost:4200): ');
        if (!frontendUrl) {
            frontendUrl = 'http://localhost:4200';
            console.log(`ℹ️  Usando URL frontend por defecto: ${frontendUrl}`);
        }
    }

    console.log(`\n🔗 Creating tunnels...`);
    console.log(`   Backend:  ${backendUrl}`);
    console.log(`   Frontend: ${frontendUrl}\n`);

    // Crear ambos túneles
    const spinnerBackend = createSpinner('🔗 Creating backend tunnel...');
    let backendTunnel;
    try {
        backendTunnel = await createTunnel(backendUrl, 'backend');
        spinnerBackend.stop();
    } catch (error) {
        spinnerBackend.stop();
        throw error;
    }

    const spinnerFrontend = createSpinner('🔗 Creating frontend tunnel...');
    let frontendTunnel;
    try {
        frontendTunnel = await createTunnel(frontendUrl, 'frontend');
        spinnerFrontend.stop();
    } catch (error) {
        spinnerFrontend.stop();
        throw error;
    }

    // Actualizar environment.ts con la URL del backend y reconstruir
    await updateEnvironmentAndRebuild(backendTunnel.url);

    // Resumen final
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 ¡Túneles creados exitosamente!');
    console.log('═'.repeat(60));
    console.log(`\n🖥️  Backend URL:  ${backendTunnel.url}`);
    console.log(`🌐 Frontend URL: ${frontendTunnel.url}`);
    console.log('\n📋 Comparte el link del Frontend para acceder a tu panel');
    console.log('═'.repeat(60));
    console.log('\n⚠️  Los túneles están corriendo en segundo plano.');
    console.log('   Para detenerlos: pkill cloudflared\n');

    // Mantener el proceso principal vivo para mostrar logs
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping tunnels...');
        backendTunnel.process.kill();
        frontendTunnel.process.kill();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        backendTunnel.process.kill();
        frontendTunnel.process.kill();
        process.exit(0);
    });

    return {
        backend: backendTunnel.url,
        frontend: frontendTunnel.url
    };
}
