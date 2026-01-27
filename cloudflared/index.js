import { startTunnel } from './tunnel.js';

(async () => {
  try {
    await startTunnel();
    process.exit(0);
  } catch (error) {
    console.error('❌ Tunnel failed:', error);
    process.exit(1);
  }
})();
