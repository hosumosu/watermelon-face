// Copies the static game into dist/ for apps-in-toss packaging.
import { cp, rm, mkdir } from 'node:fs/promises';

const targets = ['index.html', 'css', 'js', 'image', 'vendor', 'model'];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const target of targets) {
  await cp(target, `dist/${target}`, { recursive: true });
}
console.log('dist/ ready:', targets.join(', '));
