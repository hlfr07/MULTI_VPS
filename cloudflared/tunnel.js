import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/* =========================
   Cloudflare Tunnel Manager
========================= */

// Spinner para mostrar actividad
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

export async function startTunnel(targetUrl = 'http://172.17.0.2:3001') {
    console.log('🚀 Starting Cloudflare Tunnel...\n');
    console.log(`🎯 Target URL: ${targetUrl}\n`);

    // Primero matamos cualquier sesión anterior de cloudflared
    const spinnerKill = createSpinner('🛑 Stopping previous cloudflared sessions...');
    await execAsync('pkill -9 cloudflared || echo "cloudflared no estaba corriendo"');
    await execAsync('screen -wipe || echo "No dead screens"');
    // Matar sesión screen específica si existe
    await execAsync('screen -S cloudflared_backend -X quit 2>/dev/null || echo "No previous session"');
    spinnerKill.stop();

    // Crear el túnel en una sesión screen
    const spinnerTunnel = createSpinner('🌐 Creating tunnel in screen session...');
    
    // Iniciamos cloudflared en screen
    await execAsync(`screen -dmS cloudflared_backend cloudflared tunnel --url ${targetUrl}`);
    spinnerTunnel.stop();

    console.log('✅ Cloudflared started in screen session: cloudflared_backend\n');

    // Esperar unos segundos para que el túnel se establezca
    const spinnerWait = createSpinner('⏳ Waiting for tunnel URL...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    spinnerWait.stop();

    // Intentar capturar la URL del log de screen
    const spinnerCapture = createSpinner('🔍 Capturing tunnel URL...');
    
    let tunnelUrl = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!tunnelUrl && attempts < maxAttempts) {
        try {
            // Capturar output del screen
            await execAsync('screen -S cloudflared_backend -X hardcopy /tmp/cloudflared_output.txt');
            const { stdout } = await execAsync('cat /tmp/cloudflared_output.txt 2>/dev/null || echo ""');
            
            // Buscar la URL
            const urlMatch = stdout.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
            if (urlMatch) {
                tunnelUrl = urlMatch[0];
            }
        } catch (error) {
            // Ignorar errores y seguir intentando
        }

        if (!tunnelUrl) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    spinnerCapture.stop();

    if (tunnelUrl) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log(`🌐 PUBLIC URL: ${tunnelUrl}`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('📋 Share this URL to access your server from anywhere!');
        console.log('⚠️  Note: This URL will change each time you restart the tunnel.\n');
        console.log('💡 Tunnel running in screen session: cloudflared_backend');
        console.log('   - To attach: screen -r cloudflared_backend');
        console.log('   - To detach: Ctrl+A, then D');
        console.log('   - To stop: screen -S cloudflared_backend -X quit\n');
        
        return tunnelUrl;
    } else {
        console.log('\n⚠️  Could not capture tunnel URL automatically.');
        console.log('💡 The tunnel is running. Check it manually with:');
        console.log('   screen -r cloudflared_backend\n');
        
        return null;
    }
}

// Permitir pasar URL como argumento
const args = process.argv.slice(2);
if (args.length > 0 && args[0].startsWith('http')) {
    startTunnel(args[0]);
}
