// =====================================================
// TALENT ROSTER — PANEL DE ADMINISTRACIÓN
// =====================================================

const API = '';
let token = localStorage.getItem('tr_token');
let modeloActualId = null;
let fotoPerfilUrl = null;

// ---- Auth guard ----
if (!token) window.location.href = '/';

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    localStorage.removeItem('tr_token');
    window.location.href = '/';
    return;
  }
  return res;
}

// ====================================================
// MODELOS — LISTAR
// ====================================================

async function cargarModelos() {
  const grid = document.getElementById('modelosGrid');
  grid.innerHTML = '<div class="loading-panel">Cargando modelos...</div>';

  const res = await apiFetch('/api/modelos');
  const modelos = await res.json();

  if (!modelos.length) {
    grid.innerHTML = '<div class="loading-panel">No hay modelos registradas aún.</div>';
    return;
  }

  grid.innerHTML = '';
  modelos.forEach(m => {
    const nombre = m.nombre_artistico || m.nombre;
    const foto = m.foto_perfil_url || '';
    const card = document.createElement('div');
    card.className = 'modelo-card-admin';
    card.innerHTML = `
      ${foto
        ? `<img src="${foto}" alt="${nombre}" class="mca-foto" loading="lazy"/>`
        : `<div class="mca-foto" style="display:flex;align-items:center;justify-content:center;color:#333;font-size:12px;">Sin foto</div>`
      }
      <div class="mca-info">
        <div class="mca-nombre">${nombre}</div>
        <div class="mca-ciudad">📍 ${m.ciudad_base}</div>
        <span class="mca-badge ${m.activa ? 'badge-activa' : 'badge-inactiva'}">
          ${m.activa ? 'Activa' : 'Inactiva'}
        </span>
        <div class="mca-acciones">
          <button class="btn-accion" onclick="abrirEditar('${m.id}')">Editar</button>
          <button class="btn-accion" onclick="abrirPortafolio('${m.id}', '${nombre}')">Portafolio</button>
          <button class="btn-accion danger" onclick="eliminarModelo('${m.id}', '${nombre}')">Borrar</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ====================================================
// MODAL MODELO — ABRIR / CERRAR
// ====================================================

function abrirModalModelo() {
  document.getElementById('modalTitulo').textContent = 'Nueva modelo';
  document.getElementById('formModelo').reset();
  document.getElementById('modeloId').value = '';
  fotoPerfilUrl = null;
  document.getElementById('fotoPrevActual').classList.add('hidden');
  document.getElementById('fotoPrevPlaceholder').classList.remove('hidden');
  document.getElementById('uploadEstadoPerfil').textContent = '';
  document.getElementById('modalModelo').classList.remove('hidden');
}

async function abrirEditar(id) {
  const res = await apiFetch(`/api/modelos/${id}`);
  const m = await res.json();

  document.getElementById('modalTitulo').textContent = 'Editar modelo';
  document.getElementById('modeloId').value = m.id;
  document.getElementById('fNombre').value = m.nombre || '';
  document.getElementById('fNombreArtistico').value = m.nombre_artistico || '';
  document.getElementById('fCiudad').value = m.ciudad_base || '';
  document.getElementById('fEstilo').value = m.perfil_estilo || '';
  document.getElementById('fDescripcion').value = m.descripcion || '';
  document.getElementById('fTarifaSesion').value = m.tarifa_sesion || '';
  document.getElementById('fTarifaHora').value = m.tarifa_hora_adicional || '';
  document.getElementById('fTransporte').value = m.transporte_incluido ? 'true' : 'false';
  document.getElementById('fActiva').value = m.activa ? 'true' : 'false';

  fotoPerfilUrl = m.foto_perfil_url || null;
  if (fotoPerfilUrl) {
    document.getElementById('fotoPrevActual').src = fotoPerfilUrl;
    document.getElementById('fotoPrevActual').classList.remove('hidden');
    document.getElementById('fotoPrevPlaceholder').classList.add('hidden');
  } else {
    document.getElementById('fotoPrevActual').classList.add('hidden');
    document.getElementById('fotoPrevPlaceholder').classList.remove('hidden');
  }
  document.getElementById('uploadEstadoPerfil').textContent = '';
  document.getElementById('modalModelo').classList.remove('hidden');
}

function cerrarModalModelo() {
  document.getElementById('modalModelo').classList.add('hidden');
}

// ====================================================
// SUBIDA DE FOTO DE PERFIL
// ====================================================

document.getElementById('btnSubirPerfil').addEventListener('click', () => {
  document.getElementById('filePerfil').click();
});

document.getElementById('filePerfil').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const estado = document.getElementById('uploadEstadoPerfil');
  estado.textContent = 'Subiendo...';

  const formData = new FormData();
  formData.append('foto', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const data = await res.json();
  if (res.ok) {
    fotoPerfilUrl = data.url;
    document.getElementById('fotoPrevActual').src = fotoPerfilUrl;
    document.getElementById('fotoPrevActual').classList.remove('hidden');
    document.getElementById('fotoPrevPlaceholder').classList.add('hidden');
    estado.textContent = '✅ Foto subida';
  } else {
    estado.textContent = '❌ Error: ' + data.error;
  }
});

// ====================================================
// GUARDAR MODELO (crear o editar)
// ====================================================

document.getElementById('formModelo').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnGuardarModelo');
  btn.textContent = 'Guardando...';
  btn.disabled = true;

  const id = document.getElementById('modeloId').value;
  const payload = {
    nombre: document.getElementById('fNombre').value,
    nombre_artistico: document.getElementById('fNombreArtistico').value,
    ciudad_base: document.getElementById('fCiudad').value,
    perfil_estilo: document.getElementById('fEstilo').value,
    descripcion: document.getElementById('fDescripcion').value,
    tarifa_sesion: document.getElementById('fTarifaSesion').value,
    tarifa_hora_adicional: document.getElementById('fTarifaHora').value,
    transporte_incluido: document.getElementById('fTransporte').value,
    activa: document.getElementById('fActiva').value,
    foto_perfil_url: fotoPerfilUrl
  };

  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `/api/modelos/${id}` : '/api/modelos';

  const res = await apiFetch(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    cerrarModalModelo();
    cargarModelos();
  } else {
    const err = await res.json();
    alert('Error: ' + err.error);
  }

  btn.textContent = 'Guardar';
  btn.disabled = false;
});

// ====================================================
// ELIMINAR MODELO
// ====================================================

async function eliminarModelo(id, nombre) {
  if (!confirm(`¿Seguro que quieres eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const res = await apiFetch(`/api/modelos/${id}`, { method: 'DELETE' });
  if (res.ok) cargarModelos();
  else alert('Error al eliminar la modelo.');
}

// ====================================================
// PORTAFOLIO
// ====================================================

async function abrirPortafolio(modeloId, nombre) {
  modeloActualId = modeloId;
  document.getElementById('portafolioTitulo').textContent = `Portafolio — ${nombre}`;
  document.getElementById('modalPortafolio').classList.remove('hidden');
  document.getElementById('fotoDesc').value = '';
  document.getElementById('videoUrl').value = '';
  document.getElementById('videoDesc').value = '';
  document.getElementById('uploadEstadoPort').textContent = '';
  await cargarPortafolio();
}

async function cargarPortafolio() {
  const lista = document.getElementById('portLista');
  lista.innerHTML = '<p class="port-empty">Cargando...</p>';

  const res = await apiFetch(`/api/portafolio/${modeloActualId}`);
  const items = await res.json();

  if (!items.length) {
    lista.innerHTML = '<p class="port-empty">No hay contenido aún.</p>';
    return;
  }

  lista.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'port-item';
    const esFoto = item.tipo === 'foto';
    div.innerHTML = `
      ${esFoto
        ? `<img src="${item.url}" alt="${item.descripcion || ''}" class="port-item-preview"/>`
        : `<div class="port-item-video">🎬</div>`
      }
      <div class="port-item-info">
        <span class="port-item-desc">${item.descripcion || (esFoto ? 'Foto' : 'Video')}</span>
        <button class="btn-danger" onclick="eliminarPortafolioItem('${item.id}')">✕</button>
      </div>
    `;
    lista.appendChild(div);
  });
}

// Subir fotos al portafolio
document.getElementById('btnSubirPortafolio').addEventListener('click', () => {
  document.getElementById('filePortafolio').click();
});

document.getElementById('filePortafolio').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  const estado = document.getElementById('uploadEstadoPort');
  const desc = document.getElementById('fotoDesc').value;
  estado.textContent = `Subiendo ${files.length} foto(s)...`;

  let subidas = 0;
  for (const file of files) {
    const formData = new FormData();
    formData.append('foto', file);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const uploadData = await uploadRes.json();

    if (uploadRes.ok) {
      await apiFetch('/api/portafolio', {
        method: 'POST',
        body: JSON.stringify({
          modelo_id: modeloActualId,
          tipo: 'foto',
          url: uploadData.url,
          descripcion: desc,
          orden: 0
        })
      });
      subidas++;
    }
  }

  estado.textContent = `✅ ${subidas} foto(s) agregada(s)`;
  await cargarPortafolio();
  e.target.value = '';
});

// Agregar video
document.getElementById('btnAgregarVideo').addEventListener('click', async () => {
  const url = document.getElementById('videoUrl').value.trim();
  const desc = document.getElementById('videoDesc').value.trim();
  if (!url) return alert('Ingresa una URL de video.');

  const res = await apiFetch('/api/portafolio', {
    method: 'POST',
    body: JSON.stringify({
      modelo_id: modeloActualId,
      tipo: 'video',
      url,
      descripcion: desc,
      orden: 0
    })
  });

  if (res.ok) {
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoDesc').value = '';
    await cargarPortafolio();
  } else {
    alert('Error al agregar el video.');
  }
});

// Eliminar item del portafolio
async function eliminarPortafolioItem(id) {
  if (!confirm('¿Eliminar este contenido del portafolio?')) return;
  const res = await apiFetch(`/api/portafolio/${id}`, { method: 'DELETE' });
  if (res.ok) cargarPortafolio();
}

// ====================================================
// TABS DEL PORTAFOLIO
// ====================================================

document.querySelectorAll('.port-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.port-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.port-panel').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`portPanel${capitalizar(tab.dataset.tipo)}`).classList.remove('hidden');
  });
});

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ====================================================
// EVENTOS GENERALES
// ====================================================

document.getElementById('btnNuevaModelo').addEventListener('click', abrirModalModelo);
document.getElementById('modalClose').addEventListener('click', cerrarModalModelo);
document.getElementById('btnCancelarModal').addEventListener('click', cerrarModalModelo);
document.getElementById('portafolioClose').addEventListener('click', () => {
  document.getElementById('modalPortafolio').classList.add('hidden');
  modeloActualId = null;
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('tr_token');
  window.location.href = '/';
});

// Cerrar modal al hacer clic en el overlay
document.getElementById('modalModelo').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModalModelo();
});
document.getElementById('modalPortafolio').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('modalPortafolio').classList.add('hidden');
    modeloActualId = null;
  }
});

// ====================================================
// INICIAR
// ====================================================
cargarModelos();
