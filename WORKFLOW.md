# WORKFLOW — Automatizaciones

Prefijo: FLOWS
Alcance MVP: transversal

> Contrato de comportamiento del módulo (pm#620, pm#621). Se lee antes de tocar el código y se
> actualiza en la misma PR que cambie un comportamiento. Contrastado contra `origin/main` de `flows`
> v0.1.84 y `origin/develop` del hub el 05/10/2026. El detalle técnico vive en
> `architecture/hub/flows.md` (§9.3 y §9.4 tratan este módulo) y en ADR-0461.
>
> **Vocabulario.** En este documento, «automatización» es lo que el negocio monta en esta pantalla
> («cuando pase esto, haz aquello»). Los apartados `FLOWS-Fnn` son los **flujos de trabajo** de la
> persona en la pantalla, no automatizaciones.

## Para qué sirve y para quién

Automatizaciones es la pantalla donde el negocio deja escritas reglas que se cumplen solas: «cuando
se cobre una venta grande, apunta una nota en la ficha», «cada mañana a las 9, déjame la tarea de
repasar la agenda», «cuando alguien no venga, déjame la tarea de llamarle». Desde aquí se elige una
automatización hecha de la galería o se monta una desde cero, se le conceden los permisos que
necesita, se prueba sin efectos, se enciende, se lee lo que hizo y se resuelven las preguntas y los
envíos atascados. Solo la usa el **administrador** (el dueño o quien administra el negocio): una
automatización actúa en nombre del negocio sin nadie delante. Sirve igual a la peluquería y al
restaurante; lo único que cambia entre ellos son las tarjetas de la galería y las recetas que traen
sus módulos.

**Qué es del módulo y qué es del hub.** El módulo es la pantalla. **No ejecuta automatizaciones.**
Todo lo que corre vive en el motor del hub:

| Pieza | Dónde vive |
|---|---|
| Pantalla «Automatizaciones»: lista, galería, editor, bandejas y guía | Módulo, `ui/` |
| Borradores que deja el asistente (tabla propia, una consulta, una orden para dejarlo, otra para marcarlo decidido, y el aviso `flows.draft.proposed`) | Módulo, `migrations/`, `queries/drafts_list.sql`, `commands/` |
| Consulta «¿ya está montada esta automatización?» para otros módulos (`flows.automations.status`) | Módulo, `queries/automations_status.sql` |
| Guardar, encender, pausar y borrar automatizaciones; disparadores (evento, horario, fecha, a mano); pasos y su ejecución; permisos de cada automatización y sus límites; secretos; preguntas y propuestas en espera; historial de ejecuciones | Hub, `crates/runtime/src/flows/` y `crates/server/src/flows_api.rs` |
| Catálogo de eventos del negocio y ejemplos reales de cada uno | Hub, `crates/server/src/outbox_admin.rs` |
| Lo que no llegó a entregarse (cola de eventos caídos), reenviar y cerrar | Hub, `crates/runtime/src/outbox.rs` y `outbox_admin.rs` |
| Recetas de fábrica que traen otros módulos (servirlas, encenderlas, apagarlas, restaurarlas) | Hub, `crates/runtime/src/flows/templates.rs`; cada módulo publica las suyas en su carpeta `flows/` |
| Conceder al módulo «Administrar automatizaciones» | Hub, Ajustes → Permisos |

El motor (disparadores, pasos, permisos, secretos, aprobaciones, historial) lo describe el `WORKFLOW.md` del hub en `workflow/automatizaciones.md` (HUB-F80 a HUB-F112), y la cola de avisos caídos en `workflow/avisos.md` (HUB-F50 a HUB-F64).
Las recetas de fábrica (servirlas, encenderlas, apagarlas y restaurarlas) son HUB-F104 a HUB-F107 del mismo documento.

## Referencia adoptada

Ya contrastada en `.claude/agents/qa-hub-flows.md` (§«Lo más importante: los FLUJOS DE TRABAJO» y
los recorridos R0 a R10, con su puntuación contra Zapier, Make, Power Automate, Shopify Flow, Odoo y
Business Central) y en ADR-0461 (recetas primero, columna lineal, eventos con nombre). No se rehace.
De ella se adopta:

- El **recorrido canónico** de crear una automatización (Zapier, Make, Power Automate, Shopify Flow,
  Odoo): elegir cuándo de una lista → filtrar → elegir qué hacer → elegir los datos (no escribirlos)
  → probar con un caso real → encender → ver el historial → entender el fallo y reintentar.
- [Shopify Flow — plantillas y editor en columna](https://help.shopify.com/en/manual/shopify-flow):
  empezar por una plantilla y una sola columna de pasos de arriba abajo, sin lienzo.
- [Zapier — Copilot](https://help.zapier.com/hc/en-us/articles/15703650952077): el asistente propone
  un esqueleto y deja anotado lo que no supo decidir; la persona lo revisa antes de encender.
- [Power Automate — aprobaciones](https://learn.microsoft.com/en-us/power-automate/get-started-approvals)
  y Odoo «Allowed Group»: una pregunta a un rol, con plazo, y qué pasa si nadie contesta.
- Cerrar un envío atascado con **motivo de lista corta + nota opcional** (Square, Toast, Lightspeed,
  Business Central; recogido en `architecture/hub/flows.md` §9.3).

## Antes de empezar

- **Instalar Automatizaciones** (gratis). En el menú aparece como «Automatizaciones».
- **Conceder al módulo «Administrar automatizaciones»** en Ajustes → Permisos («Permisos de las
  apps»). Está denegado de fábrica: hasta concederlo, la pantalla solo muestra «Este editor necesita
  tu permiso» (FLOWS-F01).
- **Entrar como administrador.** El menú solo enseña la entrada a quien tiene el permiso de ver
  automatizaciones, que de fábrica solo tiene el perfil administrador; y el hub rechaza a cualquier
  sesión que no sea de dueño o administrador.
- **Instalar los módulos cuyos avisos y acciones se van a usar.** El desplegable de «Elige qué pasa»
  ofrece los avisos de los módulos instalados. Nueve de las diez tarjetas propias de la galería
  crean una tarea, así que necesitan el módulo Tareas (congelado); sin él la galería las esconde y lo
  dice debajo (FLOWS-F04).
- **Para mandar WhatsApp a clientes**, el número conectado en la Bandeja de WhatsApp y plantillas
  aprobadas por Meta: sin plantilla, el mensaje solo llega a quien escribió en las últimas 24 horas, y
  Meta cobra cada WhatsApp (FLOWS-F15).

Configuración inicial, paso a paso:

1. Abre **Automatizaciones** y comprueba que no sale ningún aviso de permiso (FLOWS-F01).
2. En la galería, abre una tarjeta, lee qué hará y pulsa **Usar esta** (FLOWS-F04).
3. En la pestaña **Permisos** pulsa **Autorizar todo lo que necesita** (FLOWS-F19).
4. Abre **Probar** y revisa lo que haría con lo último que pasó en el negocio (FLOWS-F20).
5. Enciende el interruptor y pulsa **Guardar** (FLOWS-F21).
6. Cuando se dispare, revísala en **Historial** (FLOWS-F23).

## Pantallas

### Automatizaciones
Menú **Automatizaciones** (una sola entrada; el módulo no tiene pestaña de Ajustes). De arriba abajo:

- El botón **Nueva automatización**, arriba a la derecha.
- **Pendiente de ti** — solo si al abrir la pantalla hay alguna pregunta o propuesta esperando: «El
  asistente quiere cambiar algo. Todavía no ha pasado nada.» y una tarjeta por cada una (FLOWS-F24).
  Mientras está a la vista se refresca sola cuando llega o caduca una; si no estaba, una pregunta nueva
  no aparece hasta volver a abrir la pantalla.
- **Necesita tu atención** — solo si hay algún envío atascado (o si el hub le niega al módulo leer esa
  cola, con «Automatizaciones no tiene permiso para ver lo que se ha atascado. Abre Ajustes →
  Permisos y concédeselo.»). Una vez que aparece, se queda durante esa visita aunque se vacíe («No hay
  nada atascado.») (FLOWS-F25).
- **Propuestas por el asistente** — solo si hay borradores: «El asistente las escribió cuando le
  pediste una automatización. No hace nada hasta que la revises y la actives.», y por cada uno su
  nombre, la etiqueta «Borrador», **Revisar** y una × («Descartar») (FLOWS-F27, FLOWS-F28).
- **Tus automatizaciones** — solo si hay alguna. El buscador «Busca por nombre, por lo que la
  arranca o por lo que hace», los desplegables «Ver», «Arranca con» y «Orden», y el recuento «Se ven
  N de M». Cada fila: casilla para elegirla, nombre, cuándo arranca («Cuando se cobra una venta»,
  «Todos los días a las 09:00», «Solo cuando pulses Ejecutar»…), la etiqueta «Activa» o «En pausa», el
  interruptor, ⧉ («Hacer una copia») y × («Borrar»). Debajo de una fila pueden salir avisos de
  revisión con su botón (FLOWS-F11). Con filtros que no dejan nada: «Aquí no hay nada que encaje con
  eso.» y **Volver a verlas todas** (FLOWS-F02).
- **La galería**, siempre, debajo de todo: «Elige una y pasa a ser tuya, apagada, para que la mires
  antes de que haga nada.», el botón **¿Cómo funciona esto?**, las tarjetas agrupadas en «Cualquier
  negocio», «Peluquería y estética» y «Bares y restaurantes», después una sección «Viene con …» por
  cada módulo que trae recetas, y al final la línea de lo que falta («Hay automatizaciones ocultas:
  necesitan el módulo …») o por qué no salen las recetas de los módulos (FLOWS-F04, FLOWS-F05).

Cargando: «Cargando…» y nada más. Errores de entrada (FLOWS-F01): «Este hub todavía no sabe
automatizar», «Este editor necesita tu permiso», «Solo el dueño o un administrador puede editar
automatizaciones», o un recuadro rojo con el mensaje del hub («Algo ha fallado. No se ha guardado
nada.» si no llega ninguno). Un fallo al encender, copiar o borrar sale en rojo arriba con el mensaje
del hub tal cual. Una bandeja que no se puede leer no rompe la pantalla: simplemente no aparece.

### Editor de automatización
Se abre al tocar una fila, al pulsar **Nueva automatización**, al usar una tarjeta o al revisar un
borrador. Cabecera: ← (vuelve a la lista **sin guardar ni preguntar**), el nombre (vacío:
«Automatización sin nombre»), la etiqueta «Activa»/«En pausa», el interruptor, **Probar** y
**Guardar** («Guardando…»). Cuatro pestañas:

- **Pasos**: la tarjeta del disparador («Cuando pase esto…»), los pasos en columna, cada uno con asa
  para arrastrar y × (las esperas y los «Solo sigue si» son tiras estrechas; el resto, tarjetas que se
  despliegan al tocarlas), y los botones
  para añadir: **Hacer algo**, **Consultar algo**, **Solo sigue si…**, **Preguntar antes a alguien**,
  **Esperar**, **Enviar un mensaje**, **Llamar a otro sistema**, **Pedírselo al asistente**. Sin
  pasos: «Todavía no hay pasos. Añade lo primero que debe hacer esta automatización.»
- **Probar**: lo que haría con lo último que pasó, sin hacer nada (FLOWS-F20).
- **Permisos**: «Una automatización se ejecuta con sus propios permisos, nunca con los tuyos. Nada de
  lo de abajo ocurre hasta que lo autorices.», las filas «Pendiente de tu permiso», «Autorizado» o
  «Dañado», y **Autorizar todo lo que necesita** (FLOWS-F19).
- **Historial**: las 20 ejecuciones más recientes, con las paradas por error arriba (FLOWS-F23).

Encima de la pestaña salen el error en rojo (el mensaje del hub tal cual), el aviso verde de lo que
acaba de pasar, el aviso naranja del interruptor (FLOWS-F21) y, en un borrador del asistente, su
recuadro (FLOWS-F27).

### Guía
Botón **¿Cómo funciona esto?** de la galería. Título «Cómo funcionan las automatizaciones» y cinco
apartados: «Qué es una automatización», «Tu primera automatización, paso a paso», «Los permisos: por
qué hay que decir que sí», «Cómo saber si funcionó» y «Lo que todavía no puede hacer», con dibujos
hechos con las mismas piezas del editor. **Volver a las automatizaciones** regresa (FLOWS-F10).

## Qué comparten los verticales

Todos los flujos son `comun`: la pantalla, el editor y las bandejas son los mismos en los dos
negocios. Lo que diferencia a la peluquería del restaurante son piezas de la galería:

| Pieza compartida | Flujos que la usan |
|---|---|
| La galería: secciones «Peluquería y estética» y «Bares y restaurantes» en la misma pantalla, con la misma regla de esconder la tarjeta cuyo módulo no está | FLOWS-F04, FLOWS-F07 |
| Las recetas de la Bandeja de WhatsApp (cita para la peluquería, mesa para el restaurante) bajo «Viene con Bandeja de WhatsApp», y su restauración | FLOWS-F05, FLOWS-F06, FLOWS-F11 |
| El módulo Tareas como acción de nueve de las diez tarjetas propias | FLOWS-F04 |
| El aviso «ya se dispara con lo mismo» y la marca «Activa / En pausa / Sin terminar» de una tarjeta | FLOWS-F04, FLOWS-F05 |
| La orden del hub que guarda una automatización entera (encender, pausar, reparar y guardar mandan el documento completo) | FLOWS-F03, FLOWS-F11, FLOWS-F12, FLOWS-F21 |
| El cálculo de los permisos que pide una automatización, leído de sus pasos | FLOWS-F04, FLOWS-F19, FLOWS-F20, FLOWS-F21 |
| La pantalla de Automatizaciones como único sitio desde el que se contesta una pregunta de cualquier automatización | FLOWS-F18, FLOWS-F24 |

## Flujos

El detalle de cada flujo vive en `workflow/`, con la misma gramática y el mismo prefijo. Huecos
(`parcial`, `no hecho`): el porqué está en la línea `Estado:` del flujo.

| ID | Flujo | Estado | Fichero |
|---|---|---|---|
| FLOWS-F01 | Entrar en Automatizaciones | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F02 | Ver, buscar y ordenar las automatizaciones del negocio | parcial | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F03 | Encender o pausar automatizaciones desde la lista | parcial | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F04 | Crear una automatización desde una tarjeta de la galería | parcial | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F05 | Usar desde la galería una receta que trae otro módulo | parcial | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F06 | Restaurar la versión de fábrica de una receta | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F07 | Llegar a una tarjeta desde otro módulo | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F08 | Hacer una copia de una automatización | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F09 | Borrar una automatización | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F10 | Leer la guía | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F11 | Reparar una automatización de WhatsApp montada con un fallo ya corregido | hecho | [workflow/lista-y-galeria.md](workflow/lista-y-galeria.md) |
| FLOWS-F12 | Crear una automatización desde cero | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F13 | Elegir cuándo arranca | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F14 | Añadir, ordenar y rellenar los pasos | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F15 | Mandar un mensaje a un cliente desde una automatización | hecho | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F16 | Llamar a otro sistema y guardar sus claves | hecho | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F17 | Pedirle un paso al asistente | hecho | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F18 | Hacer que una automatización pregunte antes a alguien | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F19 | Conceder, limitar y retirar los permisos de una automatización | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F20 | Probar una automatización sin que haga nada | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F21 | Guardar y encender una automatización desde el editor | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F22 | Ejecutar una automatización a mano | no hecho | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F23 | Ver qué hizo una automatización y por qué falló | parcial | [workflow/editor.md](workflow/editor.md) |
| FLOWS-F24 | Contestar una pregunta o una propuesta en espera | parcial | [workflow/bandejas-y-asistente.md](workflow/bandejas-y-asistente.md) |
| FLOWS-F25 | Reenviar o cerrar lo que no llegó a pasar | hecho | [workflow/bandejas-y-asistente.md](workflow/bandejas-y-asistente.md) |
| FLOWS-F26 | Pedirle al asistente una automatización | hecho | [workflow/bandejas-y-asistente.md](workflow/bandejas-y-asistente.md) |
| FLOWS-F27 | Revisar un borrador del asistente y crearlo | parcial | [workflow/bandejas-y-asistente.md](workflow/bandejas-y-asistente.md) |
| FLOWS-F28 | Descartar un borrador del asistente | hecho | [workflow/bandejas-y-asistente.md](workflow/bandejas-y-asistente.md) |
| FLOWS-F29 | Otro módulo pregunta si una automatización ya está montada | hecho | [workflow/bandejas-y-asistente.md](workflow/bandejas-y-asistente.md) |

## Cobertura contra la referencia

El recorrido canónico de `qa-hub-flows` (§«Lo más importante»), paso a paso:

| Elemento de la referencia | Estado | Flujo |
|---|---|---|
| Empezar por una plantilla de la galería | parcial: nueve de diez tarjetas propias necesitan Tareas (congelado) | F04, F05 |
| Elegir cuándo arranca de una lista (evento, horario, fecha, a mano) | hecho; sin buscador en una lista de hasta 196 avisos (flows#50) | F13 |
| Filtrar con una condición legible | parcial: «Solo sigue si…» sí; el filtro del propio disparador no se puede editar | F13, F14 |
| Elegir la acción de una lista | no hecho: el nombre de la acción o de la consulta se escribe a mano | F14 |
| Elegir los datos con ejemplos reales, sin escribirlos | hecho | F14 |
| Probar con un caso real sin efectos | parcial: no lee de verdad las consultas ni ve un permiso dañado (flows#156) | F20 |
| Ejecutar ahora, a mano | no hecho: no hay botón | F22 |
| Encender y pausar, una o varias | hecho; desde la lista sin aviso de permisos que faltan | F03, F21 |
| Historial en palabras con referencia copiable | parcial: solo las 20 últimas | F23 |
| Entender el fallo y saber qué hacer | hecho | F23, F25 |
| Reintentar una ejecución fallida desde el paso que falló | no hecho (hub#952) | F23 |
| Reenviar o cerrar con motivo lo que no se entregó | hecho; sin lista de lo cerrado (flows#47) | F25 |
| Duplicar, buscar, filtrar entre muchas | parcial: el buscador solo encuentra por el nombre de la automatización y el nombre técnico del aviso o la acción | F02, F08 |
| Permisos por automatización, con límites | parcial: antes del primer guardado «Autorizar todo» no hace nada | F19 |
| Aprobación por rol con plazo y salida por caducidad | parcial: solo un administrador puede contestar, sea cual sea el rol | F18, F24 |
| Borrador del asistente con lo que no supo decidir | hecho | F26, F27 |
| Recetas de fábrica de los módulos y volver a la de fábrica | parcial: «Usar esta» sobre una receta crea una copia desligada | F05, F06 |

## Datos: de quién es cada dato

- **Propios del módulo** (en la base del negocio, con `hub_id`): los borradores del asistente
  (`flows_flowdraft`): nombre, documento de la automatización, notas del asistente, estado
  (pendiente, usado, descartado), la automatización en que se convirtió, quién lo pidió y quién lo
  decidió, y fechas. Ninguna orden los borra: los decididos se quedan para siempre como registro.
- **Del hub** (tablas del motor; el módulo las lee y escribe solo por las puertas del hub con sesión
  de administrador): las automatizaciones y sus disparadores, sus permisos y límites, los secretos
  (cifrados, nunca legibles), las ejecuciones con lo que entró y salió de cada paso, las preguntas y
  propuestas en espera, y la cola de eventos caídos. La consulta `flows.automations.status` lee las
  automatizaciones, sus disparadores y sus permisos directamente, con `hub_id` en las tres lecturas.
- **De otros módulos**: el catálogo de avisos y sus ejemplos (lo que declaran los módulos instalados
  y lo que el hub ha visto pasar), las recetas de fábrica que publica cada módulo, y las plantillas de
  WhatsApp aprobadas (Bandeja de WhatsApp, lectura opcional).
- **Datos personales** (inventario RGPD):
  - en el módulo: quién pidió y quién decidió cada borrador (identificador del usuario); y el nombre,
    el documento y las notas del borrador, que son texto que escribe el asistente y pueden llevar el
    nombre o el teléfono de un cliente si se los dijeron. El borrado de un cliente no los toca;
  - el aviso `flows.draft.proposed` lleva lo mismo que la orden que deja el borrador (nombre,
    documento y notas); vive en el registro de avisos del hub, que lo borra a los 90 días;
  - en el hub: lo que entró y salió de cada paso de cada ejecución (nombres, el texto de un
    WhatsApp…), que el hub borra a los 90 días del final de la ejecución; el texto de una pregunta en
    espera, la propuesta del asistente con sus datos y la nota de quien contesta, que mueren con su
    ejecución; el contenido completo de cada evento caído, que se ve en pantalla en FLOWS-F25 (uno
    atascado se guarda hasta que alguien lo decide; uno cerrado, con quién lo cerró y por qué, 90
    días); y quién creó y cambió cada automatización y permiso;
  - el teléfono o el email al que va un mensaje no queda en el historial de la ejecución (el paso lo
    marca como oculto): solo viaja en la cola de envío;
  - al borrar los datos de un cliente, el hub vacía lo que su historial **terminado** guardaba de él
    (avisos entregados o cerrados, ejecuciones terminadas con sus pasos y propuestas); lo atascado y lo
    que sigue en marcha no se vacía;
  - la pantalla enseña en claro los datos que viajan en una propuesta y en un evento caído.

## Reglas que no se rompen

- **Solo un administrador.** Todas las puertas del motor (automatizaciones, permisos, secretos,
  preguntas, ejecuciones, eventos caídos, recetas de fábrica) exigen sesión de dueño o administrador;
  lo comprueba el hub. Cuando la llamada la hace un módulo, como esta pantalla, el hub exige además
  que ese módulo tenga «Administrar automatizaciones». Las puertas de recetas de fábrica (listar,
  encender, apagar y restaurar) no lo piden: un módulo solo toca sus propias recetas, salvo
  restaurar, que también puede quien tenga ese permiso.
- **Un borrador no es una automatización.** El asistente solo puede dejar un borrador: la orden lo
  guarda siempre como pendiente, en una tabla del módulo que el motor no conoce. Solo se convierte en
  automatización cuando un administrador lo guarda en el editor.
- **Un borrador se decide una vez.** Marcar como usado o descartado un borrador que ya no está
  pendiente falla y no cambia nada.
- **Nada nace con permisos.** Crear desde la galería, copiar o crear un borrador no concede ningún
  permiso; la única excepción son los permisos con límite que declara una receta (FLOWS-F05), y si el
  hub no puede guardar el límite, la pantalla retira todos los de esa automatización.
- **Una automatización actúa con sus propios permisos**, nunca con los de quien la creó; un paso sin
  su permiso se rechaza al ejecutarse. Conceder permisos es una lista entera: si nombra una acción que
  el hub no tiene, se rechaza la lista completa.
- **Un secreto no se vuelve a leer.** El hub solo devuelve los nombres.
- **Una pregunta espera como mucho 30 días**; el hub rechaza un plazo mayor al guardar.
- **Pausar o borrar para lo que estaba en marcha, con excepciones.** Una ejecución pendiente o en
  curso de una automatización pausada o borrada se cancela en su siguiente paso. Al pausar, una espera
  se cancela solo al despertar (si se vuelve a encender antes, sigue); las preguntas y las propuestas
  del asistente se quedan en la bandeja, pero aprobar una propuesta mientras siga en pausa se niega y
  no hace nada (FLOWS-F24); los mensajes en cola no salen: caen en «Eventos caídos» con su destinatario
  y se reenvían a mano (FLOWS-F25), y una llamada a otro sistema o un turno del asistente ya en marcha
  terminan. Al borrar, lo que esperaba un plazo se
  cancela al momento; lo que esperaba una respuesta se cancela cuando alguien contesta la pregunta,
  rechaza la propuesta o caduca, y aprobar una propuesta de una automatización borrada contesta «sin
  permiso» y la deja pendiente (FLOWS-F03, FLOWS-F09).
- **Aislamiento.** Los borradores y la consulta de estado van siempre con el `hub_id` del negocio.

## Lo que NO hace, a propósito

- No ejecuta nada: el motor es del hub. La pantalla solo guarda, enciende, pausa y lee.
- No tiene bifurcaciones: una automatización es una sola columna; un «Solo sigue si» que no se cumple
  la termina (eso es funcionar, no fallar). Dos desenlaces son dos automatizaciones, o una pregunta que
  «sigue» más una condición sobre su respuesta (FLOWS-F18).
- No es un lienzo de nodos (ADR-0461): en una tablet del mostrador una columna se usa con el dedo.
- No cuenta hacia atrás desde una fecha del aviso («el día antes de la cita») ni ofrece «avisar cuando
  el stock baje de X» en la galería.
- El asistente no propone pasos de mensaje, de llamar a otro sistema ni de asistente: cuestan dinero
  o salen fuera, y los añade la persona.
- No enciende las recetas de fábrica de otros módulos: eso lo hace la pantalla de cada módulo (por
  ejemplo, Ajustes de la Bandeja de WhatsApp) por la puerta del hub.
- No tiene etiquetas: el hub no tiene dónde. La pantalla no enseña quién creó o cambió una
  automatización, aunque el hub lo guarda. Y lo que se crea desde la galería no queda ligado a su
  tarjeta: el hub solo guarda la receta de origen de lo que se enciende desde la pantalla de su módulo.
- No hace que el hub cree en pausa: la galería, la copia y el borrador nacen en pausa porque la
  pantalla lo pide así; el hub, si no le dicen nada, crea la automatización encendida.
- No manda SMS.

## Dudas abiertas

Se resuelven con `market-decision`; no las decide el worker.

1. ¿Debe haber un botón «Ejecutar ahora» para las automatizaciones «Solo a mano» (Zapier, Make y
   Power Automate lo tienen), sabiendo que el hub ejecuta de verdad y no tiene modo de prueba?
2. ¿Quién debe poder contestar una pregunta dirigida a un rol (responsable, empleado)? Hoy la bandeja
   solo la ve un administrador, así que el rol elegido no cambia nada.
3. ¿Qué hacen las tarjetas de la galería que dependen de Tareas, ahora que Tareas está congelado:
   otra acción, otro aviso, o fuera?
4. «Usar esta» sobre una receta de otro módulo, ¿debe encenderla por la puerta del hub (como hace la
   Bandeja de WhatsApp) en vez de crear una copia desligada?
5. ¿Debe avisar el interruptor de la lista de los permisos que faltan, como avisa el del editor?
6. ¿Debe avisar «Volver» de que hay cambios sin guardar?
7. ¿Debe poder editarse el filtro del disparador («solo cuando el total pase de…»)?
8. ¿Cuánto se conservan los borradores decididos y deben entrar en el borrado de un cliente?
9. `flows.automations.status` ya no la consulta ningún módulo en `origin/main` (sí puede usarla el
   asistente, que la tiene como herramienta): ¿se mantiene?

## Fuentes contrastadas

Contra `origin/main` de `flows` v0.1.84 y `origin/develop` del hub (05/10/2026). Una línea por
discrepancia; manda el código.

- **`hand-book/modulos/flows.md` y `docs/screens.md`**: «Ejecutar ahora» / «Run it now»; no existe
  ningún botón que ejecute una automatización, y el disparador «Solo a mano» dice «Solo cuando pulses
  Ejecutar» (F22).
- **`hand-book/modulos/flows.md`**: «Las personas con el rol solicitado pueden responder … desde la
  bandeja Esperando por ti»; la bandeja se llama «Pendiente de ti» y solo la abre un administrador (el
  hub exige su sesión), así que nadie más contesta (F18, F24).
- **`hand-book/modulos/flows.md`**: la galería sale «cuando todavía no hay automatizaciones»; sale
  siempre, debajo de la lista. Los botones son «Volver a enviarlo» y «Cerrarlo», no «Enviar de nuevo» y
  «Cerrar» (F04, F25).
- **`docs/screens.md`**: cada fila de la lista enseña «its last run»; no la enseña (F02).
- **`docs/screens.md`**: la caja de secretos vive en la pestaña Permisos; vive dentro del paso
  «Llamar a otro sistema» (F16).
- **`docs/screens.md`**: el disparador por aviso admite «a filter on the event's own fields»; la
  pantalla no tiene dónde escribirlo; lo conserva si ya venía, también al cambiar de aviso (F13).
- **`docs/screens.md`**: dentro de una automatización hay **Delete**; solo se borra desde la × de la
  lista (F09).
- **`README.md`**: la tarjeta se crea «con lo que tienes que decidir señalado»; lo que hay que decidir
  solo se lista en la tarjeta antes de crearla, el editor no lo marca. Y tres tarjetas preguntan «En la
  lista de quién cae» / «Quién la revisa» sin que la automatización lleve ese dato (F04).
- **`docs/limits.md`** («el motor v1 no tiene paso de lectura ni grants de tipo `query`») y
  `architecture/hub/flows.md` §9.3 (catálogo «escrito a mano» que pinta en gris; «el asistente no
  puede crear un flujo», pm#131): desfasados; hay paso «Consultar algo», el catálogo lo da el hub
  desde hub#823 y el asistente deja borradores (F13, F14, F26).
- **`architecture/hub/flows.md` §9.3**: `flows.automations.status` la consume la tarjeta de WhatsApp;
  en `origin/main` de `whatsapp_inbox` ya no la llama (usa `flows.drafts.list` solo para saber si
  Automatizaciones está instalado) (F29).
- **Sin confirmación al guardar** (leído en el código, sin ejecutar): el aviso que el editor fija al
  guardar se borra en el mismo instante, así que tras **Guardar** no sale nada; «Permisos
  actualizados.» solo se ve tras **Autorizar todo lo que necesita** o **Guardar límites** (F12, F21).
- **Texto equivocado**: con un hub cuyo formato de automatizaciones es **más nuevo** que el del
  módulo, la pantalla dice «Este hub todavía no sabe automatizar … Actualiza el hub» (F01).
- **Texto que no se cumple**: el buscador dice «por lo que la arranca o por lo que hace», pero solo
  encuentra por el nombre de la automatización y por el nombre técnico del aviso o la acción
  (`sale.completed`, `tasks.tasks.create`), no por la frase que se ve (F02).
- **Texto equivocado**: la bandeja «Pendiente de ti» dice «El asistente quiere cambiar algo.» también
  cuando lo que espera es una pregunta de un paso «Preguntar antes a alguien», sin asistente (F24).
- **Texto inalcanzable**: «Esta pregunta se hizo a otro rol y no puedes contestarla tú.» no puede salir
  desde la pantalla: solo entra un administrador y un administrador siempre puede contestar (F24).
- **Textos en inglés o técnicos en la pantalla española**: los roles del desplegable de «Quién tiene
  que contestar» (`admin`, `manager`, `employee`); el nombre técnico del aviso y del módulo en cada
  evento caído («sale.completed no llegó a salir», «de sales») y su contenido en bruto; los nombres
  técnicos de las acciones en la pestaña Permisos; y los mensajes de error del hub, que se pintan tal
  cual llegan (F16, F18, F19, F25).
- **Claves de `locales/es.json` que la pantalla no usa**: «Ejecutar ahora», «Está en marcha…»,
  «¿Borrar esta automatización?», «Crearla en pausa», «Creada y en pausa…», «Ver más antiguas»,
  «Última vez: …», «No se ha ejecutado nunca», «Todavía no hay nada automatizado» y las cuatro tarjetas
  de WhatsApp escritas a mano (`tpl.waAppointment*`, `tpl.waReservation*`), retiradas en flows#101.
- **Guion `qa-hub-flows` R2 y R10**: prueban «Ejecutar» y desactivar por la API y por la UI del módulo;
  la UI no ejecuta (F22).
