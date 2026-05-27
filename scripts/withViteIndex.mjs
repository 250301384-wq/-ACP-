import path from 'node:path';
import fs from 'node:fs/promises';

const rootDir = process.cwd();
const indexPath = path.join(rootDir, 'index.html');
const viteIndexPath = path.join(rootDir, 'index.dev.html');
const mode = process.argv[2];

if (!['build', 'dev'].includes(mode)) {
  console.error('Usage: node scripts/withViteIndex.mjs <build|dev>');
  process.exit(1);
}

const originalIndex = await fs.readFile(indexPath, 'utf8').catch(() => '');
const viteIndex = await fs.readFile(viteIndexPath, 'utf8');

async function restoreIndex() {
  if (originalIndex) {
    await fs.writeFile(indexPath, originalIndex, 'utf8');
  }
}

await fs.writeFile(indexPath, viteIndex, 'utf8');

let restored = false;
async function restoreOnce() {
  if (restored) return;
  restored = true;
  await restoreIndex();
}

let shutdown = async (exitCode) => {
  await restoreOnce();
  process.exit(exitCode);
};

process.on('SIGINT', () => {
  void shutdown(130);
});

process.on('SIGTERM', () => {
  void shutdown(143);
});

try {
  const vite = await import('vite');

  if (mode === 'build') {
    await vite.build();
    await restoreOnce();
  } else {
    const server = await vite.createServer({
      server: {
        host: '0.0.0.0',
      },
    });
    await server.listen();
    server.printUrls();

    shutdown = async (exitCode) => {
      await server.close();
      await restoreOnce();
      process.exit(exitCode);
    };

    await new Promise(() => undefined);
  }
} catch (error) {
  await restoreOnce();
  throw error;
}
