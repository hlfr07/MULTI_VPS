import { startTunnel } from './tunnel.js';

(async () => {
  try {
    const urls = await startTunnel();
    console.log(`\n🔗 Backend:  ${urls.backend}`);
    console.log(`🌐 Frontend: ${urls.frontend}`);
    
    // Mantener el proceso vivo
    console.log('\n💡 Presiona Ctrl+C para detener los túneles\n');
  } catch (error) {
    console.error('❌ Tunnel failed:', error);
    process.exit(1);
  }
})();
