# Pendientes

Detectado el 14/09/2026, al levantar el panel tras la limpieza de Docker del
servidor. Se deja para una sesión dedicada: el proyecto está empezando (una
sola modelo) y la prioridad ahora son los menús.

**Nada de esto afecta a otros proyectos del servidor.** Se revisó: las fotos
viven dentro del contenedor de este panel, la base es un proyecto de Supabase
propio (`catalogo-modelos`) y el borrado sin validar solo alcanza los archivos
de este contenedor.

**Mientras no se arregle el punto 1: no subir fotos al panel.** Se pierden en el
siguiente despliegue. Enlazar fotos externas funciona.

## 1. Las fotos no se guardan fuera del contenedor

Dokploy muestra un volumen bind `/opt/talent-roster/uploads` → `/app/uploads`,
pero el servicio **no lo tiene aplicado**:

```bash
docker service inspect vtalentroaster-adminvtalent-x1wmpp --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}'
# null
```

y `/opt/talent-roster/uploads` no existe en el servidor. Las subidas van a la
capa del contenedor y **cada despliegue las borra**.

Ya costó una foto: `/uploads/1777264762743-fqpxcaxdgyr.jpg`, del portafolio,
subida el 27/04/2026. Da 404 y no está en ningún sitio del disco. En la web
pública sale como imagen rota.

Cómo arreglarlo:

1. Comprobar en qué app de Dokploy está el volumen: tiene que ser
   `adminvtalent`, que es quien guarda. Mirar también
   `vtalentroaster-vtalent-vkg4ag` con el mismo `docker service inspect`.
2. `mkdir -p /opt/talent-roster/uploads` en el anfitrión. Swarm no arranca un
   servicio con un bind a una ruta que no existe.
3. Deploy, y repetir el `inspect`: debe salir el montaje.
4. Subir una foto, redesplegar y comprobar que sigue en
   `/opt/talent-roster/uploads`.
5. Volver a subir la foto perdida o borrar ese elemento del portafolio.

## 2. `DELETE /api/upload/:filename` no valida el nombre

`path.join(__dirname, 'uploads', req.params.filename)` con un nombre como
`..%2F..%2Fserver.js` —Express decodifica el `%2F`— sale de la carpeta de
fotos. Pide sesión, así que el riesgo es bajo, pero se arregla con
`path.basename()` y comprobando que la ruta final sigue dentro de `uploads`.
El mismo cuidado en `DELETE /api/portafolio/:id`, que ya usa `basename`.

## 3. Las fotos no tienen respaldo

El respaldo diario del servidor (restic a Backblaze) solo copia
`/opt/menus/uploads`. Cuando el punto 1 esté hecho y haya fotos de verdad,
añadir `/opt/talent-roster/uploads`. Ver `respaldo/` en
`adminmenus_restaurantes`.

## 4. Menores

- **Docker mata el proceso en cada despliegue** en vez de pararlo: `node` como
  PID 1 no atiende `SIGTERM`. Si se estaba subiendo una foto, se corta. Mismo
  caso que el panel de menús.
- **`ADMIN_PASSWORD` se compara en claro** y `/api/login` no limita intentos.
- **`app.use(cors())`** abre la API a cualquier origen.

## Hecho

- **14/09/2026** — El panel llevaba caído desde finales de agosto (Bad
  Gateway). La imagen se perdió del servidor y al reconstruirla la última
  `@supabase/supabase-js` exigía Node 22. Arreglado en el PR #1: Node 22,
  `package-lock.json` y `npm ci`.
