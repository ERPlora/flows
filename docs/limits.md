# flows — lo que NO hace (y por qué)

## Fuera del motor, no de la interfaz

- **Ramas y bucles.** Son `schema_version: 2` y **cambio de motor**. La interfaz no promete lo que
  el kernel no ejecuta: por eso una guardia es un chip y no un rombo.
- **Índices de array.** El lenguaje de mapeo recorre `a.b.c` y no tiene indexación
  (`def.rs::resolve_path`). El selector muestra una lista **en gris, con el motivo**, en vez de
  ofrecer un `lines.0.total` que el kernel no sabría resolver.

## «Probar» no ejecuta — y no es una simplificación

El botón **Probar** (flows#2) NO llama a `POST …/flows/{id}/run`: ese endpoint ejecuta **de
verdad**, commands incluidos, y un «probar» que cobra una venta de prueba es peor que no tenerlo.
Tampoco hay modo dry-run en el kernel, y el kernel está **congelado** (ADR-0283) — comprobado
contra el código, no supuesto: no hay `dry_run`/`simulate`/`test_mode` en `crates/runtime` ni en
`crates/server`.

Y tampoco hay endpoint que devuelva un payload real: `…/events/shape` devuelve la **forma**
(ADR-0312 lo decide así a propósito). Lo que sí trae son **muestras reales por campo**, y de ahí
se reconstruye el `input`. Es dato del hub, no un mock.

Consecuencias que la pantalla dice en voz alta en vez de disimular:

- una **muestra retenida** (`redacted`) no es un hueco: se marca como «hay valor y no se enseña»;
- una guarda que lee un campo retenido contesta **«no se puede saber»**, nunca un veredicto: estar
  seguro y equivocado sería lo único que haría esta función peor que no tenerla;
- `steps.<id>.…` es la salida de un paso que **no ha corrido**: se marca como desconocida, no como
  vacía;
- un `{{secret.X}}` **jamás** se resuelve aquí — sería el único sitio del producto donde una
  credencial write-only se vuelve legible.

## Ya NO es un límite: «Probar» antes de activar

Esta sección decía que probar contra la última venta/cita real quedaba «fuera de esta entrega».
**Lo entregó flows#2** (v0.1.5) y está descrito arriba: la pestaña reconstruye el `input` con las
muestras reales por campo de `…/events/shape` y recorre la espina sin ejecutar nada.

Se deja escrito el porqué, que sigue siendo la razón de que la pestaña exista: la gente **no**
predice bien el comportamiento de un flujo con un fallo, ni leyéndolo (Brackenbury et al., CHI
2019).

## Lo que el borrador por IA NO hace (flows#4)

Ya existe —el asistente deja la propuesta en la bandeja— pero con límites que son decisiones, no
deudas escondidas:

- **No propone `notify`, `http` ni `ai`** — y no es que no se pueda: desde flows#3 el editor los
  termina. Es que lo que un modelo puede **proponer** es más estrecho que lo que una persona puede
  **construir**: un `http` llama a una URL que no eligió nadie, un `notify` cuesta dinero por
  mensaje y un `ai` es otra llamada facturada. Así que «mándale un WhatsApp» sale como la tarea más
  parecida que sí funciona, y el asistente lo dice en sus notas. El dueño añade el `notify` a mano.
- **No concede permisos, y no hay forma de que lo haga.** El borrador no es un flujo, así que no
  hay a qué conceder nada. Los grants se piden después, sobre la automatización ya creada, y los
  concede una persona.
- **No comprueba que el command exista.** El hub no tiene endpoint que liste sus commands (sí de
  eventos, hub#823). Un nombre inventado se rechaza al **guardar** y otra vez al conceder el
  permiso — tarde, pero nunca en silencio.
- **No recuerda la conversación.** Cada propuesta es una fila suelta: el asistente no puede
  «corregir la de antes», escribe otra. Corregir es lo que hace el dueño en la espina.

## Lo que la galería NO ofrece, y por qué (flows#1)

Las dos plantillas que todo el mundo pide primero **no se pueden construir** con el motor de hoy, y
por eso no están: ofrecerlas sería vender algo que no funciona.

- **«Recordar la cita el día antes».** El `delay` del kernel espera **desde ahora**, no hasta una
  fecha que venga en el evento, y el lenguaje de mapeo no hace aritmética con fechas. Lo más
  parecido que sí funciona —y que está en la galería— es un disparador de reloj: cada mañana, la
  tarea de repasar la agenda de mañana.
- **«Avisar cuando el stock baje de X».** `inventory.stock_changed` lleva `{product_id, qty}` —
  **lo que se ha movido**, no las existencias que quedan (verificado contra un hub real). No hay
  evento de nivel de stock; `inventory.products.low_stock` es una **query**, y el motor v1 no tiene
  paso de lectura ni grants de tipo `query`.

Las dos se nombran en la guía del dueño, en «Lo que todavía no puede hacer».

## Limitaciones que son deuda del hub, no de este módulo

- ~~**No hay endpoint que LISTE los eventos de un hub.**~~ **Resuelto** por hub#823 y cableado por
  flows#8 (v0.1.8): `GET /api/hub/events` devuelve la unión de lo que declaran los módulos
  instalados y lo que el outbox ha visto de verdad, así que el desplegable ofrece los eventos de
  ESTE negocio. El catálogo escrito a mano (`trigger-catalog.ts`) sobrevive **solo como
  diccionario** de etiquetas, tal y como se predijo aquí; un evento sin frase se ofrece igual, con
  su nombre crudo. Y cuando el hub no puede contestar, la pantalla lo dice — no hay fall back
  silencioso a la lista de antes.
- **Tampoco hay catálogo de commands.** El nombre del command de un paso se escribe a mano, y quien
  lo verifica de verdad es `PUT …/grants`, que rechaza la lista entera si nombra un command que no
  existe — así que el error llega en el sitio donde se puede arreglar.
