require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const segredo = process.env.JWT_SECRET || '';
if (segredo.length < 32 || /troque-esta-chave/i.test(segredo)) {
  console.error('JWT_SECRET em falta ou fraco. Use uma chave aleatória com 32+ caracteres no ficheiro .env.');
  console.error('Gere uma com:  npm run segredo');
  process.exit(1);
}

const app = express();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
fs.mkdirSync(uploadDir, { recursive: true });
app.set('uploadDir', uploadDir);

// Atrás de um proxy (Nginx, Render, etc.) defina TRUST_PROXY=1 para o limite de tentativas ver o IP real.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

const origens = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean) : [];
if (process.env.NODE_ENV === 'production' && !origens.length) {
  console.error('Em produção defina CORS_ORIGIN com o endereço do site.');
  process.exit(1);
}

// A API só devolve JSON, PDFs e vídeos. Só o site (CORS_ORIGIN) pode incorporar os ficheiros num iframe.
// (Sem default-src restritivo para não impedir o leitor de PDF do navegador.)
app.use(helmet({
  contentSecurityPolicy: false, // cabeçalho próprio abaixo (só frame-ancestors)
  frameguard: false, // substituído por frame-ancestors abaixo
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
}));
const frameAncestors = (origens.length ? origens : ["'self'"]).join(' ');
app.use((req, res, next) => { res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors}`); next(); });
app.use(cors({ origin: origens.length ? origens : true, methods: ['GET', 'POST', 'PUT', 'DELETE'], maxAge: 600 }));
app.use(express.json({ limit: '100kb' }));

// Registo de pedidos (sem query string: os links de ficheiros levam o token).
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    if (req.path === '/api/saude') return;
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - t}ms`);
  });
  next();
});

app.get('/api/saude', async (req, res) => {
  try { await require('./config/db').query('SELECT 1'); res.json({ ok: true, base_de_dados: 'ligada' }); }
  catch { res.status(503).json({ ok: false, base_de_dados: 'indisponível' }); }
});

const limitar = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.' },
});

app.use('/api/auth', limitar, require('./routes/auth'));
app.use('/api/aulas', require('./routes/aulas'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ erro: 'Recurso não encontrado.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ erro: err.code === 'LIMIT_FILE_SIZE' ? 'O ficheiro excede o tamanho máximo (500 MB).' : 'Erro no envio do ficheiro.' });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'Pedido inválido (JSON mal formado).' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Já existe um registo com estes dados.' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ erro: status >= 500 ? 'Erro interno do servidor.' : err.message });
});

const porta = Number(process.env.PORT || 4000);
app.listen(porta, () => console.log(`API EaD a correr em http://localhost:${porta}`));
