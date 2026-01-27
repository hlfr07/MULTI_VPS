import { startTunnel } from './tunnel.js';

(async () => {
  try {
    const url = await startTunnel();
    console.log(`\n🎉 Tunnel URL: ${url}`);
  } catch (error) {
    console.error('❌ Tunnel failed:', error);
    process.exit(1);
  }
})();
