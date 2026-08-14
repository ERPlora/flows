# flows — lo que NO hace (y por qué)

## Fuera del motor, no de la interfaz

- **Ramas y bucles.** Son `schema_version: 2` y **cambio de motor**. La interfaz no promete lo que
  el kernel no ejecuta: por eso una guardia es un chip y no un rombo.
- **Índices de array.** El lenguaje de mapeo recorre `a.b.c` y no tiene indexación
  (`def.rs::resolve_path`). El selector muestra una lista **en gris, con el motivo**, en vez de
  ofrecer un `lines.0.total` que el kernel no sabría resolver.

## Fuera de esta entrega (v1)

- **Borrador generado por IA.** El asistente ya conoce las tools de este hub concreto; genera
  **borrador**, nunca flujo activo (la evidencia dice que acierta el esqueleto y falla los
  parámetros). Aterrizaría en esta misma lista vertical.

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

- **No hay endpoint que LISTE los eventos de un hub.** `…/events/shape?name=` contesta qué trae
  **un** evento, pero hay que saber su nombre para preguntar. El desplegable se siembra de un
  catálogo corto escrito a mano (los eventos que importan a un restaurante y a una peluquería) y
  **cada uno se verifica contra el hub**; lo que este fichero no conoce se alcanza por el campo de
  texto libre. Con un catálogo real servido por HTTP, esta lista pasaría a ser solo etiquetas.
- **Tampoco hay catálogo de commands.** El nombre del command de un paso se escribe a mano, y quien
  lo verifica de verdad es `PUT …/grants`, que rechaza la lista entera si nombra un command que no
  existe — así que el error llega en el sitio donde se puede arreglar.
