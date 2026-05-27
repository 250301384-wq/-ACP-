import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const filesToCopy = ['index.html', 'questions.json', 'import_errors.json', 'question_meta.json'];
const assetsSource = path.join(distDir, 'assets');
const assetsTarget = path.join(rootDir, 'assets');

async function copyFileFromDist(file) {
  await fs.copyFile(path.join(distDir, file), path.join(rootDir, file));
}

await fs.access(distDir);
await fs.rm(assetsTarget, { recursive: true, force: true });
await fs.cp(assetsSource, assetsTarget, { recursive: true });

for (const file of filesToCopy) {
  await copyFileFromDist(file);
}

console.log('Synced dist output to repository root for branch-based GitHub Pages.');
