# Twinned Adventures — versión 3 compacta con videos

Primera página reformulada para reducir el desplazamiento. Astro 7, TypeScript, Tailwind CSS, daisyUI, Sanity y Cloudflare Pages Functions.

## Verla sin instalar

Extraer el ZIP y abrir `preview.es.html` o `preview.en.html`. Incluyen el diseño y usan los videos en la carpeta `public/media`; mantener los archivos del paquete juntos. Para revisar la vista previa independiente entregada aparte, basta con abrir `twinned-adventures-v2-preview.html`: el video, estilos, imágenes y scripts están incorporados. Los formularios de ambas vistas requieren servidor configurado y no guardan solicitudes desde un archivo local.

## Qué cambia

- Encabezado con video inmersivo río abajo: 15 segundos, sin sonido, en bucle y versiones escritorio/celular.
- Imagen de respaldo y reproducción automática al entrar.
- Video adicional con un equipo descendiendo los rápidos, visible y automático dentro de la página.
- Resumen del tour y precio USD 100.
- Itinerario, equipo, seguridad, qué llevar y opiniones agrupados en pestañas.
- Bloque visible **Opiniones de viajeros** con botón **Escribir mi comentario**. Abre nombre, correo, país, fecha, código de reservación, estrellas, comentario y consentimiento. El administrador aprueba antes de publicar. Se valida que corresponde a una reservación completada.
- Reservas, seguimiento y contacto en ventanas, sin formularios extensos desplegados en la página.
- Botón fijo de reserva en celular.
- Español e inglés.

## Desarrollo en Visual Studio Code

Node 22.12 o posterior. Abrir esta carpeta y ejecutar:

```sh
npm install
npm run dev
npm run check
npm run build
```

Copiar `.env.example` a `.env`. El servidor de Astro muestra la página; para ejecutar las funciones, construir y usar `npx wrangler pages dev dist` con secretos en `.dev.vars`.

## Activar Sanity y Cloudflare

1. Crear un proyecto Sanity con dataset privado para proteger correos, reservas y consultas.
2. Configurar SANITY_PROJECT_ID, SANITY_DATASET y SANITY_API_TOKEN solo en servidor/build; nunca usar PUBLIC_ para secretos.
3. `npm run studio` abre el administrador. Configurar el tour, datos, itinerario, inclusiones, FAQ y contacto. Los cambios visibles del CMS requieren reconstruir y desplegar.
4. Cloudflare Pages: build `npm run build`, salida `dist`. Functions en `functions/api`.
5. Configurar PUBLIC_SITE_URL, PUBLIC_WHATSAPP, PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY y las variables privadas de Sanity.
6. Turnstile debe aceptar el dominio de publicación y los entornos de prueba. Agregar limitación de solicitudes a `/api/*` en Cloudflare.
7. ADMIN_WEBHOOK_URL es opcional para notificaciones mediante un servicio propio: recibe solo el ID y el tipo, y debe resolver información desde un servidor autorizado.
8. Tras autenticar Wrangler, `npm run deploy`.

No hay una cuenta Sanity o Cloudflare conectada en esta entrega. Sin configuración los formularios muestran servicio no disponible y no anuncian guardados ficticios. Enviar una solicitud no confirma ni cobra la reserva. Las opiniones requieren una reserva completada y quedan pendientes de aprobación.

## Medios

Los videos están incluidos físicamente en `public/media`. Créditos, enlaces originales y licencia indicada por cada plataforma en `VIDEO_CREDITS.md`. Se muestran como referencias visuales de rafting, no como grabaciones del tour específico de la empresa.

## Datos pendientes

Confirmar río, ubicación, duración, dificultad, edad mínima, horarios, cupos, certificaciones de guías, inclusiones finales, contacto, impuestos, cancelaciones y privacidad antes de lanzamiento. No se inventaron reseñas ni certificaciones. No hay carga pública de fotos en el formulario de opinión, mapas o analítica activa.

## Validación

Astro check y build. Verificación del video H.264 sin audio, duración y resoluciones. Verificación de ambas rutas, cinco pestañas, ventanas de formularios, bloque visible de comentarios y enlaces de reserva. Esta entrega no ha sido probada con cuentas reales de Sanity/Cloudflare. La versión anterior validó ocho casos del backend con servicios simulados; el backend permanece igual.

Interacciones verificadas en DOM simulado para ES/EN: reproducir/pausar video, pestañas con teclado, abrir/cerrar formulario visible de comentarios, reserva y confirmación simulada, reproducción automática de los dos clips. No se hizo una inspección visual en navegador ni prueba real de entrega de formularios.

## Actualización de reproducción y diseño

Ambos videos están visibles en la página y tienen autoplay, muted, loop, playsinline y preload=auto. El principal usa fuentes para móvil/escritorio. Se eliminan las llamadas a reproducir y el reproductor en ventana: el segundo clip corre directamente en el bloque de experiencia. Un pequeño control de pausa permite detener o reanudar las animaciones. El navegador puede impedir autoplay por sus propias políticas; en ese caso se conserva la imagen de respaldo. Los videos se pausan al cambiar de pestaña y se reanudan al volver. Menú, portada, precio, bloques, pestañas, preguntas y formularios tienen bordes redondeados y sombras suaves.

## Opiniones de muestra

Se agregaron tres tarjetas de ejemplo inspiradas en la referencia adjunta, con estrellas y textos de rafting. Están claramente identificadas como muestras, sin cifras de Tripadvisor, verificaciones ficticias ni reseñas de Epic Adventures atribuidas a Twinned Adventures. Cuando Sanity devuelve opiniones aprobadas, las reemplazan automáticamente. En móvil se deslizan horizontalmente para mantener la página corta.

## Referencia visual adicional

La página adopta fondo oscuro, menú flotante translúcido sobre el video, acentos verde lima, titulares con degradado verde y tarjetas de esquinas suaves. Se conservaron marca Twinned Adventures, precio y textos del rafting. No se copiaron calificaciones, años de experiencia ni datos de Epic Adventures.

## Paleta final de río y agua

Se conserva la composición moderna, con fondo azul profundo, superficies azul petróleo, detalles turquesa y aqua, y titulares con degradado de agua. Se sustituyen los acentos verde lima de la referencia.

## Paleta actual: cálida y luminosa

Se reemplaza la paleta azul/turquesa por marfil, arena, terracota y café oscuro. La estructura, los comentarios y los videos automáticos se mantienen.
