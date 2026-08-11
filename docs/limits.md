# flows — lo que NO hace (y por qué)

## Fuera del motor, no de la interfaz

- **Ramas y bucles.** Son `schema_version: 2` y **cambio de motor**. La interfaz no promete lo que
  el kernel no ejecuta: por eso una guardia es un chip y no un rombo.
- **Índices de array.** El lenguaje de mapeo recorre `a.b.c` y no tiene indexación
  (`def.rs::resolve_path`). El selector muestra una lista **en gris, con el motivo**, en vez de
  ofrecer un `lines.0.total` que el kernel no sabría resolver.

## Fuera de esta entrega (v1)

- **Galería de plantillas.** La entrada sigue siendo la lista con su estado vacío. Las plantillas
  sectoriales van con los blueprints y llegan después.
- **«Probar» antes de activar** contra la última venta/cita real. Probablemente la función de más
  valor del editor (Brackenbury et al., CHI 2019: la gente **no** predice bien el comportamiento
  de un flujo con un fallo, ni leyéndolo). Necesita `POST …/run` con un input sintetizado y una
  vista de «qué habría pasado» que no escriba nada; no cabía aquí.
- **Borrador generado por IA.** El asistente ya conoce las tools de este hub concreto; genera
  **borrador**, nunca flujo activo (la evidencia dice que acierta el esqueleto y falla los
  parámetros). Aterrizaría en esta misma lista vertical.
- **Editar los steps `http`, `ai` y `notify`.** Se **abren en solo lectura** y se guardan intactos.
  Un `http` necesita además la pantalla de secretos (write-only) y los grants por patrón de URL;
  un `ai`, la de aprobaciones. Cada una es su propia entrega.
- **La bandeja de aprobación** (`GET …/approvals`) como pantalla.

## Limitaciones que son deuda del hub, no de este módulo

- **No hay endpoint que LISTE los eventos de un hub.** `…/events/shape?name=` contesta qué trae
  **un** evento, pero hay que saber su nombre para preguntar. El desplegable se siembra de un
  catálogo corto escrito a mano (los eventos que importan a un restaurante y a una peluquería) y
  **cada uno se verifica contra el hub**; lo que este fichero no conoce se alcanza por el campo de
  texto libre. Con un catálogo real servido por HTTP, esta lista pasaría a ser solo etiquetas.
- **Tampoco hay catálogo de commands.** El nombre del command de un paso se escribe a mano, y quien
  lo verifica de verdad es `PUT …/grants`, que rechaza la lista entera si nombra un command que no
  existe — así que el error llega en el sitio donde se puede arreglar.
