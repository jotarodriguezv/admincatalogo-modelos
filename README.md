# Admin Catálogo Modelos — Talent Roster

Panel de administración y API para gestionar el catálogo de modelos.

## Estructura

```
admincatalogo-modelos/
├── server.js           → API Node.js (rutas, auth, subida de fotos)
├── Dockerfile          → Para despliegue en Dokploy
├── package.json
├── .env.example        → Variables de entorno requeridas
├── .gitignore
├── uploads/            → Fotos subidas (NO se sube a GitHub)
└── public/
    ├── index.html      → Página de login
    ├── panel.html      → Panel de administración
    ├── css/admin.css
    └── js/admin.js
```

## Variables de entorno (configurar en Dokploy)

| Variable | Descripción |
|---|---|
| `PORT` | `3000` |
| `BASE_URL` | `https://adminvtalent.verificame.click` |
| `ADMIN_USER` | Usuario del panel |
| `ADMIN_PASSWORD` | Contraseña del panel |
| `JWT_SECRET` | Cadena larga aleatoria para firmar tokens |
| `SUPABASE_URL` | URL de tu proyecto Supabase (sin /rest/v1/) |
| `SUPABASE_SERVICE_KEY` | Service key de Supabase |

## Despliegue en Dokploy

1. Crea una nueva **Application** en tu proyecto de Dokploy
2. Conecta el repositorio `admincatalogo-modelos` de GitHub
3. En **Build** selecciona **Dockerfile**
4. En **Environment Variables** agrega todas las variables de arriba
5. En **Domains** agrega `adminvtalent.verificame.click`
6. Despliega

## Persistencia de fotos

Las fotos se guardan en la carpeta `/app/uploads` dentro del contenedor.
Para que no se pierdan al redesplegar, configura un **Volume** en Dokploy:
- Host path: `/opt/talent-roster/uploads` (o la ruta que prefieras en tu VPS)
- Container path: `/app/uploads`

## API Endpoints

Todos los endpoints (excepto /api/login) requieren header:
`Authorization: Bearer <token>`

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/login | Iniciar sesión |
| GET | /api/modelos | Listar todas las modelos |
| GET | /api/modelos/:id | Obtener una modelo |
| POST | /api/modelos | Crear modelo |
| PUT | /api/modelos/:id | Actualizar modelo |
| DELETE | /api/modelos/:id | Eliminar modelo |
| GET | /api/portafolio/:modeloId | Obtener portafolio |
| POST | /api/portafolio | Agregar item |
| DELETE | /api/portafolio/:id | Eliminar item |
| POST | /api/upload | Subir foto |

## Pendientes

Ver [`PENDIENTES.md`](PENDIENTES.md). **Hasta resolver el primero, no subir fotos al panel:** se pierden al redesplegar.
