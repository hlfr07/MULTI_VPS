import { initServer } from './init.js';

(async () => {
  try {
    await initServer();
  } catch (error) {
    console.error('❌ Init failed:', error);
    process.exit(1);
  }
})();
