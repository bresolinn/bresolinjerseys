import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DATA_ROOT = process.env.DATA_PATH || './Wenye Jerseys';
// ─── CLOUDINARY CONFIG ───────────────────────────────────────────────────────
const CLOUDINARY_CLOUD = 'dt9t6mgbn';
const CLOUDINARY_API_KEY = '376977982193685';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_SECRET || '';
const CDN_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/f_auto,q_auto`;

/** Converte URL do Yupoo em URL pública do Cloudinary (WebP automático) */
function toCoverUrl(yupooUrl) {
  if (!yupooUrl) return '';
  const publicId = crypto.createHash('md5').update(yupooUrl).digest('hex');
  return `${CDN_BASE}/${publicId}`;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '-')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseTxtFile(txtPath) {
  try {
    const content = fs.readFileSync(txtPath, 'utf-8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let name = '';
    const images = [];

    for (const line of lines) {
      if (line.startsWith('Álbum:') || line.startsWith('Album:') || line.startsWith('Ãlbum:')) {
        name = line.replace(/^[^:]+:\s*/, '').trim();
      } else if (line.startsWith('Link:')) {
        continue;
      } else if (line.startsWith('http')) {
        images.push(line);
      }
    }

    if (!name) {
      name = path.basename(path.dirname(txtPath));
    }

    return { name, images };
  } catch (e) {
    console.error('Erro ao ler txt:', txtPath, e.message);
    return null;
  }
}

function findTxtFile(dir) {
  try {
    const entries = fs.readdirSync(dir);
    return entries.find(e => e.endsWith('.txt')) || null;
  } catch {
    return null;
  }
}

function isAlbum(dir) {
  return !!findTxtFile(dir);
}

function readDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name !== '.image-cache')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        const stat = fs.statSync(fullPath);
        return { name: e.name, fullPath, mtime: stat.mtimeMs };
      })
      .sort((a, b) => {
        const aIsOther = a.name.toLowerCase().startsWith('other');
        const bIsOther = b.name.toLowerCase().startsWith('other');
        if (aIsOther && !bIsOther) return 1;  // a vai para o fim
        if (!aIsOther && bIsOther) return -1; // b vai para o fim
        return a.name.localeCompare(b.name);  // demais em ordem alfabética
      });

    return entries;
  } catch {
    return [];
  }
}

function readDirectoryByDate(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name !== '.image-cache')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        const stat = fs.statSync(fullPath);
        return { name: e.name, fullPath, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime); // mais antigos primeiro
  } catch {
    return [];
  }
}

// ─── CATALOG BUILDER ─────────────────────────────────────────────────────────
function buildCatalog() {
  const catalog = { categories: [] };
  const topLevel = readDirectory(DATA_ROOT);

  for (const cat of topLevel) {
    const category = {
      name: cat.name,
      slug: slugify(cat.name),
      subcategories: [],
      products: [],
    };

    // Busca filhos — mas separa álbuns diretos (por data) de subcategorias (alfabética)
    const childrenAlpha = readDirectory(cat.fullPath);
    const childrenByDate = readDirectoryByDate(cat.fullPath);

    // Subcategorias em ordem alfabética
    for (const child of childrenAlpha) {
      if (!isAlbum(child.fullPath)) {
        const subcategory = {
          name: child.name,
          slug: slugify(child.name),
          products: [],
        };

        const albums = readDirectoryByDate(child.fullPath);
        for (const album of albums) {
          if (isAlbum(album.fullPath)) {
            const txtFile = findTxtFile(album.fullPath);
            const parsed = parseTxtFile(path.join(album.fullPath, txtFile));
            if (parsed && parsed.images.length > 0) {
              subcategory.products.push({
                id: slugify(album.name),
                name: parsed.name || album.name,
                cover: toCoverUrl(parsed.images[0]),
                _coverSrc: parsed.images[0],
                images: parsed.images,
              });
            }
          }
        }

        if (subcategory.products.length > 0) {
          category.subcategories.push(subcategory);
        }
      }
    }

    // Álbuns diretos por data de modificação
    for (const child of childrenByDate) {
      if (isAlbum(child.fullPath)) {
        const txtFile = findTxtFile(child.fullPath);
        const parsed = parseTxtFile(path.join(child.fullPath, txtFile));
        if (parsed && parsed.images.length > 0) {
          category.products.push({
            id: slugify(child.name),
            name: parsed.name || child.name,
            cover: toCoverUrl(parsed.images[0]),
            _coverSrc: parsed.images[0],
            images: parsed.images,
          });
        }
      }
    }

    catalog.categories.push(category);
  }

  return catalog;
}

// ─── CACHE ────────────────────────────────────────────────────────────────────
let catalogCache = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

function getCatalog() {
  const now = Date.now();
  if (!catalogCache || now - cacheTime > CACHE_TTL) {
    catalogCache = buildCatalog();
    cacheTime = now;
  }
  return catalogCache;
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.get('/api/catalog', (req, res) => {
  try {
    res.json(getCatalog());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', (req, res) => {
  const catalog = getCatalog();
  const summary = catalog.categories.map(c => ({
    name: c.name,
    slug: c.slug,
    hasSubcategories: c.subcategories.length > 0,
    productCount: c.products.length + c.subcategories.reduce((acc, s) => acc + s.products.length, 0),
    cover: getCategoryCover(c),
  }));
  res.json(summary);
});

function getCategoryCover(category) {
  if (category.products.length > 0) return category.products[0].cover;
  for (const sub of category.subcategories) {
    if (sub.products.length > 0) return sub.products[0].cover;
  }
  return null;
}

app.get('/api/categories/:catSlug', (req, res) => {
  const catalog = getCatalog();
  const cat = catalog.categories.find(c => c.slug === req.params.catSlug);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  res.json(cat);
});

app.get('/api/categories/:catSlug/subcategories/:subSlug', (req, res) => {
  const catalog = getCatalog();
  const cat = catalog.categories.find(c => c.slug === req.params.catSlug);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const sub = cat.subcategories.find(s => s.slug === req.params.subSlug);
  if (!sub) return res.status(404).json({ error: 'Subcategory not found' });
  res.json(sub);
});

app.get('/api/categories/:catSlug/products/:productId', (req, res) => {
  const catalog = getCatalog();
  const cat = catalog.categories.find(c => c.slug === req.params.catSlug);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const product = cat.products.find(p => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(sanitizeProduct(product));
});

app.get('/api/categories/:catSlug/subcategories/:subSlug/products/:productId', (req, res) => {
  const catalog = getCatalog();
  const cat = catalog.categories.find(c => c.slug === req.params.catSlug);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const sub = cat.subcategories.find(s => s.slug === req.params.subSlug);
  if (!sub) return res.status(404).json({ error: 'Subcategory not found' });
  const product = sub.products.find(p => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(sanitizeProduct(product));
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json([]);
  const catalog = getCatalog();
  const results = [];
  for (const cat of catalog.categories) {
    for (const p of cat.products) {
      if (p.name.toLowerCase().includes(q)) {
        results.push({ ...p, category: cat.name, categorySlug: cat.slug });
      }
    }
    for (const sub of cat.subcategories) {
      for (const p of sub.products) {
        if (p.name.toLowerCase().includes(q)) {
          results.push({ ...p, category: cat.name, categorySlug: cat.slug, subcategory: sub.name, subcategorySlug: sub.slug });
        }
      }
    }
  }
  res.json(results.map(p => { const { _coverSrc, ...rest } = p; return rest; }));
});

/** Remove _coverSrc e criptografa images[] antes de enviar ao cliente */
function sanitizeProduct(p) {
  const { _coverSrc, ...rest } = p;
  return {
    ...rest,
    images: (p.images || []).map(url => toImageToken(url)),
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, dataRoot: DATA_ROOT, exists: fs.existsSync(DATA_ROOT) });
});

app.get('/api/debug', (req, res) => {
  const catalog = getCatalog();
  const summary = catalog.categories.map(c => ({
    name: c.name,
    slug: c.slug,
    products: c.products.map(p => ({ name: p.name, id: p.id, images: p.images.length })),
    subcategories: c.subcategories.map(s => ({
      name: s.name,
      slug: s.slug,
      products: s.products.map(p => ({ name: p.name, id: p.id, images: p.images.length })),
    })),
  }));
  res.json(summary);
});

// ─── PROXY DE IMAGENS ─────────────────────────────────────────────────────────
import https from 'https';
import http from 'http';



// ── Helpers ───────────────────────────────────────────────────────────────────

function urlToPublicId(url) {
  // Usa o MD5 da URL como public_id — mesma lógica do sistema anterior
  return crypto.createHash('md5').update(url).digest('hex');
}

/** URL pública via Cloudinary CDN com WebP automático */
function cloudinaryUrl(publicId) {
  return `${CDN_BASE}/${publicId}`;
}

/** Verifica se a imagem já existe no Cloudinary */
/** Busca todos os public_ids já existentes no Cloudinary de uma vez só */
async function fetchExistingInCloudinary() {
  const existing = new Set();
  if (!CLOUDINARY_API_SECRET) return existing;

  const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
  let nextCursor = null;

  do {
    const url = nextCursor
      ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/resources/image/upload?max_results=500&next_cursor=${nextCursor}`
      : `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/resources/image/upload?max_results=500`;

    const data = await new Promise((resolve, reject) => {
      const req = https.get(url, { headers: { Authorization: `Basic ${auth}` } }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) {
              console.warn('⚠️  Cloudinary API erro:', parsed.error.message);
              resolve({ resources: [] });
            } else {
              resolve(parsed);
            }
          } catch (e) { reject(e); }
        });
      });
      req.on('error', (e) => {
        console.warn('⚠️  Erro ao buscar lista do Cloudinary:', e.message);
        resolve({ resources: [] });
      });
    });

    const resources = data.resources || [];
    // Log na primeira página para debug
    if (existing.size === 0 && resources.length > 0) {
      console.log('🔍 Exemplos public_id Cloudinary:', resources.slice(0, 3).map(r => r.public_id));
    }
    for (const resource of resources) {
      existing.add(resource.public_id);
    }
    nextCursor = data.next_cursor || null;
  } while (nextCursor);

  return existing;
}

/** Faz upload de um arquivo local para o Cloudinary via multipart */
async function uploadFileToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_API_SECRET) {
      return reject(new Error('CLOUDINARY_SECRET não definido'));
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + CLOUDINARY_API_SECRET)
      .digest('hex');

    const boundary = '----CloudinaryBoundary' + Date.now();
    const CRLF = '\r\n';

    function field(name, value) {
      return `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`;
    }

    const preamble = Buffer.from(
      field('api_key', CLOUDINARY_API_KEY) +
      field('timestamp', String(timestamp)) +
      field('public_id', publicId) +
      field('signature', signature) +
      `--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${publicId}${ext}"${CRLF}Content-Type: ${mimeType}${CRLF}${CRLF}`
    );
    const epilogue = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
    const body = Buffer.concat([preamble, fileBuffer, epilogue]);

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json);
        } catch (e) {
          reject(new Error('Resposta inválida do Cloudinary'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/** Baixa imagem do Yupoo e salva no .image-cache local */
function fetchImageToCache(url, cachePath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'Referer': 'https://www.yupoo.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      const fileStream = fs.createWriteStream(cachePath);
      response.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', (e) => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        reject(e);
      });
    });
    req.on('error', reject);
  });
}
/** Busca imagem diretamente do Yupoo e serve para o cliente (fotos internas) */
function proxyImageDirect(url, res) {
  const client = url.startsWith('https') ? https : http;
  const ext = url.includes('.png') ? '.png' : '.jpg';
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  const req = client.get(url, {
    headers: {
      'Referer': 'https://www.yupoo.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    }
  }, (response) => {
    res.setHeader('Content-Type', response.headers['content-type'] || contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.pipe(res);
  });
  req.on('error', () => res.status(500).send('Erro ao carregar imagem'));
}


// ── Set de URLs de capa ───────────────────────────────────────────────────────
const coverUrls = new Set();
const CACHE_DIR = path.join(DATA_ROOT, '.image-cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function loadCoverUrls() {
  const catalog = getCatalog();
  for (const cat of catalog.categories) {
    for (const p of cat.products) if (p._coverSrc) coverUrls.add(p._coverSrc);
    for (const sub of cat.subcategories)
      for (const p of sub.products) if (p._coverSrc) coverUrls.add(p._coverSrc);
  }
}

// ── Token de URL opaco ───────────────────────────────────────────────────────
// Criptografa/descriptografa URLs do Yupoo para que nunca apareçam no frontend.
// O frontend só vê um token como /api/img/7f3a9c2b — sem rastro do fornecedor.

const IMG_TOKEN_SECRET = process.env.IMG_TOKEN_SECRET || 'wenye-img-secret-2024';
const IMG_ALGORITHM = 'aes-256-cbc';
const IMG_KEY = crypto.scryptSync(IMG_TOKEN_SECRET, 'salt-wenye', 32);

function encryptUrl(url) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(IMG_ALGORITHM, IMG_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(url, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptToken(token) {
  try {
    const [ivHex, encHex] = token.split(':');
    if (!ivHex || !encHex) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(IMG_ALGORITHM, IMG_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// ── Rota /api/image ───────────────────────────────────────────────────────────
// Capas  → redirect para Cloudinary CDN (WebP automático, via URL já pronta no catálogo)
// Fotos internas → o catálogo entrega token opaco; servidor descriptografa e faz proxy
app.get('/api/image', (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('http')) return res.status(400).send('URL inválida');
  // Rota legada de capas (caso chame com URL direta)
  proxyImageDirect(url, res);
});

// Nova rota para fotos internas — token opaco, URL do Yupoo nunca exposta
app.get('/api/img/:token', (req, res) => {
  const url = decryptToken(req.params.token);
  if (!url || !url.startsWith('http')) return res.status(400).send('Token inválido');
  proxyImageDirect(url, res);
});

// ── Rota para gerar token de uma URL (chamada pelo catálogo/frontend) ──────────
// Não é pública — só usada internamente para montar as URLs no catálogo
function toImageToken(url) {
  return `/api/img/${encryptUrl(url)}`;
}

// ── Warmup: garante que todas as capas estão no Cloudinary ───────────────────
// 1. Se a capa já está no .image-cache local → faz upload do arquivo
// 2. Se não está no cache → baixa do Yupoo para o cache → faz upload
// 3. Se já existe no Cloudinary → pula
async function warmupCache() {
  loadCoverUrls();
  console.log(`☁️  ${coverUrls.size} capas no catálogo. Buscando lista do Cloudinary...`);

  if (!CLOUDINARY_API_SECRET) {
    console.warn('⚠️  CLOUDINARY_SECRET não definido — pulando sincronização.');
    console.warn('   Defina no start.bat: set CLOUDINARY_SECRET=sua_secret_aqui');
    return;
  }

  // Busca TUDO que já está no Cloudinary de uma vez (sem checar imagem por imagem)
  const existingInCloud = await fetchExistingInCloudinary();
  console.log(`☁️  ${existingInCloud.size} imagens já no Cloudinary.`);

  // Filtra só as que faltam
  // Log exemplo de public_id local para comparar com o do Cloudinary
  const exemploUrl = [...coverUrls][0];
  if (exemploUrl) console.log('🔍 Exemplo public_id local:', urlToPublicId(exemploUrl));

  const faltando = [...coverUrls].filter(url => !existingInCloud.has(urlToPublicId(url)));

  if (faltando.length === 0) {
    console.log('✅ Todas as capas já estão no Cloudinary. Nada a enviar.');
    return;
  }

  console.log(`📤 ${faltando.length} capas para enviar...`);

  let novas = 0;
  let baixadas = 0;
  let falhas = 0;

  for (const url of faltando) {
    const publicId = urlToPublicId(url);
    const ext = url.includes('.png') ? '.png' : '.jpg';
    const cachePath = path.join(CACHE_DIR, publicId + ext);

    // Não está no cache local? Baixa do Yupoo primeiro.
    if (!fs.existsSync(cachePath)) {
      try {
        await fetchImageToCache(url, cachePath);
        baixadas++;
      } catch (e) {
        console.warn(`  ⚠️  Falha ao baixar do Yupoo: ${e.message}`);
        falhas++;
        continue;
      }
    }

    // Faz upload do arquivo local para o Cloudinary
    try {
      await uploadFileToCloudinary(cachePath, publicId);
      novas++;
      if (novas % 10 === 0) console.log(`  ☁️  ${novas}/${faltando.length} enviadas...`);
    } catch (e) {
      console.warn(`  ⚠️  Falha no upload: ${e.message}`);
      falhas++;
    }

    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`✅ Cloudinary sincronizado: ${novas} enviadas, ${baixadas} baixadas do Yupoo, ${falhas} falhas.`);
}


app.listen(PORT, () => {
  console.log(`🚀 Wenye Jerseys API rodando na porta ${PORT}`);
  console.log(`📁 Lendo dados de: ${DATA_ROOT}`);
  console.log('☁️  Imagens via Cloudinary CDN (WebP automático)');
  warmupCache();
});