require('dotenv').config();
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Supabase ----
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos del panel
app.use(express.static(path.join(__dirname, 'public')));

// Servir fotos subidas públicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Multer (subida de fotos) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const carpeta = path.join(__dirname, 'uploads');
    if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });
    cb(null, carpeta);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombre = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, nombre);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    const tipos = /jpeg|jpg|png|webp/;
    const valido = tipos.test(path.extname(file.originalname).toLowerCase());
    if (valido) cb(null, true);
    else cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
});

// ---- Middleware de autenticación ----
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ====================================================
// RUTAS DE AUTENTICACIÓN
// ====================================================

// POST /api/login
app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  if (
    usuario === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
});

// ====================================================
// RUTAS DE MODELOS
// ====================================================

// GET /api/modelos — listar todas (incluyendo inactivas)
app.get('/api/modelos', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('modelos')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/modelos/:id — obtener una modelo
app.get('/api/modelos/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('modelos')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Modelo no encontrada' });
  res.json(data);
});

// POST /api/modelos — crear nueva modelo
app.post('/api/modelos', authMiddleware, async (req, res) => {
  const {
    nombre, nombre_artistico, ciudad_base, perfil_estilo,
    descripcion, tarifa_sesion, tarifa_hora_adicional,
    transporte_incluido, foto_perfil_url, activa
  } = req.body;

  const { data, error } = await supabase
    .from('modelos')
    .insert([{
      nombre, nombre_artistico, ciudad_base, perfil_estilo,
      descripcion,
      tarifa_sesion: parseFloat(tarifa_sesion),
      tarifa_hora_adicional: parseFloat(tarifa_hora_adicional),
      transporte_incluido: transporte_incluido === 'true' || transporte_incluido === true,
      foto_perfil_url,
      activa: activa === 'true' || activa === true
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/modelos/:id — actualizar modelo
app.put('/api/modelos/:id', authMiddleware, async (req, res) => {
  const {
    nombre, nombre_artistico, ciudad_base, perfil_estilo,
    descripcion, tarifa_sesion, tarifa_hora_adicional,
    transporte_incluido, foto_perfil_url, activa
  } = req.body;

  const { data, error } = await supabase
    .from('modelos')
    .update({
      nombre, nombre_artistico, ciudad_base, perfil_estilo,
      descripcion,
      tarifa_sesion: parseFloat(tarifa_sesion),
      tarifa_hora_adicional: parseFloat(tarifa_hora_adicional),
      transporte_incluido: transporte_incluido === 'true' || transporte_incluido === true,
      foto_perfil_url,
      activa: activa === 'true' || activa === true
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/modelos/:id — eliminar modelo
app.delete('/api/modelos/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('modelos')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ====================================================
// RUTAS DE PORTAFOLIO
// ====================================================

// GET /api/portafolio/:modeloId — obtener portafolio de una modelo
app.get('/api/portafolio/:modeloId', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('portafolio')
    .select('*')
    .eq('modelo_id', req.params.modeloId)
    .order('orden', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/portafolio — agregar item al portafolio
app.post('/api/portafolio', authMiddleware, async (req, res) => {
  const { modelo_id, tipo, url, descripcion, orden } = req.body;
  const { data, error } = await supabase
    .from('portafolio')
    .insert([{ modelo_id, tipo, url, descripcion, orden: parseInt(orden) || 0 }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/portafolio/:id — eliminar item del portafolio
app.delete('/api/portafolio/:id', authMiddleware, async (req, res) => {
  // Si es una foto local, borrarla del servidor también
  const { data: item } = await supabase
    .from('portafolio')
    .select('url')
    .eq('id', req.params.id)
    .single();

  if (item && item.url && item.url.includes('/uploads/')) {
    const filename = path.basename(item.url);
    const filepath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  const { error } = await supabase
    .from('portafolio')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ====================================================
// RUTA DE SUBIDA DE FOTOS
// ====================================================

// POST /api/upload — subir una foto
app.post('/api/upload', authMiddleware, upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto' });
  const url = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// DELETE /api/upload/:filename — borrar foto del servidor
app.delete('/api/upload/:filename', authMiddleware, (req, res) => {
  const filepath = path.join(__dirname, 'uploads', req.params.filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return res.json({ ok: true });
  }
  res.status(404).json({ error: 'Archivo no encontrado' });
});

// ---- Ruta raíz → panel de login ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---- Iniciar servidor ----
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
