import { startTunnel } from './tunnel.js';

async function main() {
    try {
        await startTunnel();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
