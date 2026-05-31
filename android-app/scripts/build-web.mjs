import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rootDir = path.dirname(appDir);
const indexPath = path.join(rootDir, 'index.html');
const viteIndexPath = path.join(rootDir, 'index.dev.html');
const outDir = path.join(appDir, 'web');

const originalIndex = await fs.readFile(indexPath, 'utf8').catch(() => '');
const viteIndex = await fs.readFile(viteIndexPath, 'utf8');

async function restoreIndex() {
  if (originalIndex) {
    await fs.writeFile(indexPath, originalIndex, 'utf8');
  }
}

try {
  await fs.writeFile(indexPath, viteIndex, 'utf8');
  const viteModulePath = pathToFileURL(path.join(rootDir, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href;
  const vite = await import(viteModulePath);

  await vite.build({
    root: rootDir,
    base: './',
    publicDir: path.join(rootDir, 'public'),
    build: {
      outDir,
      emptyOutDir: true,
    },
  });
} finally {
  await restoreIndex();
}
