// ─────────────────────────────────────────────────────────────────────────────
// Gera o arquivo order-cache.json com a ordem ATUAL das pastas (baseada na data
// de modificação, do jeito que já está funcionando no seu localhost).
//
// COMO USAR:
//   1. Rode este script no seu computador (onde a ordem está do jeito que você
//      quer):    node generate-order-cache.js
//   2. Isso cria/atualiza o arquivo backend/order-cache.json
//   3. Comite esse arquivo junto com o resto do projeto e suba pro GitHub/Render
//
// Sempre que adicionar produtos novos e quiser "travar" a nova ordem, rode este
// script de novo antes de subir a atualização.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_ROOT = process.env.DATA_PATH || 'C:\\Users\\gbres\\Documents\\Site Camisas\\Wenye Jerseys';
const OUTPUT_PATH = path.join(__dirname, 'order-cache.json');

function isAlbum(dir) {
  try {
    return fs.readdirSync(dir).some(f => f.endsWith('.txt'));
  } catch {
    return false;
  }
}

function readDirsByMtime(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name !== '.image-cache')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        const stat = fs.statSync(fullPath);
        return { name: e.name, fullPath, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime); // mesmo critério do server.js
  } catch {
    return [];
  }
}

function readDirsAlpha(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name !== '.image-cache')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        return { name: e.name, fullPath };
      })
      .sort((a, b) => {
        const aIsOther = a.name.toLowerCase().startsWith('other');
        const bIsOther = b.name.toLowerCase().startsWith('other');
        if (aIsOther && !bIsOther) return 1;
        if (!aIsOther && bIsOther) return -1;
        return a.name.localeCompare(b.name);
      });
  } catch {
    return [];
  }
}

function relKey(dirPath) {
  return path.relative(DATA_ROOT, dirPath).split(path.sep).join('/');
}

function main() {
  if (!fs.existsSync(DATA_ROOT)) {
    console.error(`❌ Pasta de dados não encontrada: ${DATA_ROOT}`);
    console.error('   Defina a variável de ambiente DATA_PATH apontando pra pasta correta, se necessário.');
    process.exit(1);
  }

  const orderCache = {};
  const topLevel = readDirsAlpha(DATA_ROOT);

  for (const cat of topLevel) {
    // Álbuns diretos da categoria (ordenados por data)
    const directAlbums = readDirsByMtime(cat.fullPath).filter(c => isAlbum(c.fullPath));
    if (directAlbums.length > 0) {
      orderCache[relKey(cat.fullPath)] = directAlbums.map(c => c.name);
    }

    // Subcategorias (pastas que não são álbum em si)
    const children = readDirsAlpha(cat.fullPath);
    for (const child of children) {
      if (isAlbum(child.fullPath)) continue;
      const albums = readDirsByMtime(child.fullPath).filter(c => isAlbum(c.fullPath));
      if (albums.length > 0) {
        orderCache[relKey(child.fullPath)] = albums.map(c => c.name);
      }
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(orderCache, null, 2), 'utf-8');
  console.log(`✅ order-cache.json gerado com ${Object.keys(orderCache).length} pastas.`);
  console.log(`   Salvo em: ${OUTPUT_PATH}`);
  console.log('   Agora comite esse arquivo e suba pro GitHub/Render.');
}

main();
