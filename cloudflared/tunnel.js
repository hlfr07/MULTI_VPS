import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/* =========================
   Cloudflare Tunnel Manager
========================= */

export async function startTunnel(targetUrl = 'http://172.17.0.2:3001') {
    console.log('🚀 Starting Cloudflare Tunnel...\n');
    console.log(`🎯 Target URL: ${targetUrl}\n`);

    // Primero matamos cualquier proceso anterior de cloudflared
    try {
        await execAsync('pkill -9 cloudflared || echo "cloudflared no estaba corriendo"');
    } catch (e) {
        // Ignorar si no estaba corriendo
    }

    return new Promise((resolve, reject) => {
        const cloudflared = spawn('cloudflared', ['tunnel', '--url', targetUrl], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let tunnelUrl = null;
        let resolved = false;

        // Función para buscar la URL del túnel en el output
        const extractTunnelUrl = (data) => {
            const text = data.toString();
            
            // Buscar la URL de trycloudflare.com
            const urlMatch = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
            
            if (urlMatch && !resolved) {
                tunnelUrl = urlMatch[0];
                resolved = true;
                
                console.log('\n═══════════════════════════════════════════════════════════════');
                console.log(`🌐 PUBLIC URL: ${tunnelUrl}`);
                console.log('═══════════════════════════════════════════════════════════════\n');
                console.log('📋 Share this URL to access your server from anywhere!');
                console.log('⚠️  Note: This URL will change each time you restart the tunnel.\n');
                console.log('Press Ctrl+C to stop the tunnel.\n');
                
                resolve(tunnelUrl);
            }
        };

        // Escuchar stdout
        cloudflared.stdout.on('data', (data) => {
            extractTunnelUrl(data);
            console.log(data.toString().trim());
        });

        // Escuchar stderr (cloudflared imprime info aquí)
        cloudflared.stderr.on('data', (data) => {
            extractTunnelUrl(data);
            console.log(data.toString().trim());
        });

        cloudflared.on('error', (error) => {
            if (!resolved) {
                reject(new Error(`Failed to start cloudflared: ${error.message}`));
            }
        });

        cloudflared.on('close', (code) => {
            if (!resolved) {
                reject(new Error(`cloudflared exited with code ${code}`));
            } else {
                console.log('\n🛑 Tunnel closed.');
            }
        });

        // Timeout de 30 segundos para obtener la URL
        setTimeout(() => {
            if (!resolved) {
                cloudflared.kill();
                reject(new Error('Timeout: Could not get tunnel URL within 30 seconds'));
            }
        }, 30000);
    });
}

// Permitir pasar URL como argumento
const args = process.argv.slice(2);
if (args.length > 0 && args[0].startsWith('http')) {
    startTunnel(args[0]);
}
