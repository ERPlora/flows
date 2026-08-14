# flows — el editor visual de automatizaciones

## Qué hace por tu negocio

Automatiza el trabajo repetitivo **sin programar**. Le dices *cuándo* (se reserva una cita, el
stock baja de X, cada día a las 9:00) y *qué hacer* (avisar al cliente, mandarte un recordatorio,
crear una tarea), y a partir de ahí ocurre solo, sin que nadie esté delante.

Ejemplos de lo que la gente monta el primer día: recordatorio de cita el día antes · aviso cuando
un producto se queda sin stock · mensaje de «gracias» tras la primera compra · resumen del cierre
cada noche.

Tú decides además **qué puede tocar** cada automatización: se conceden permisos uno a uno, y el
historial deja por escrito, en lenguaje llano, todo lo que hizo.

Al abrirlo **no te encuentras una pantalla en blanco**: hay una galería de automatizaciones ya
hechas, por sector, que se eligen de una en una. La que elijas se crea **apagada**, con lo que
tienes que decidir señalado y con los permisos que necesita explicados **antes** de encenderla.

Y si prefieres no montarla tú: **pídesela al asistente**. «Cuando alguien no venga a su cita,
recuérdame llamarle» y te deja la automatización escrita — pero **como borrador**: aparece arriba
del todo marcada como *Borrador*, apagada, sin permisos y con lo que no ha sabido decidir señalado.
No hace nada hasta que la revisas y la enciendes tú.

Y hay una **guía dentro del propio módulo** («¿Cómo funciona esto?», en la galería): qué es una
automatización, tu primera paso a paso, los permisos, cómo saber si funcionó y —sin adornos— lo
que todavía no puede hacer.

> Es de la casa, **gratis**, y aparece en el menú como **Automatizaciones**. Al instalarlo te pide
> un permiso (*Administrar automatizaciones*): sin él el editor no abre — se concede en
> **Ajustes → Permisos**.

---

## Lo técnico

La cara visible del **kernel de automatización** del Hub (ADR-0283, `architecture/hub/flows.md`).
El motor está en el core y **congelado**; esto es producto, y el producto vive en un módulo, como
todo lo demás. Diseño: [ERPlora/pm#110](https://github.com/ERPlora/pm/issues/110).

## Qué es, en una frase

`Cuando pase … → Paso → Paso`: **una columna vertical**, tarjetas a ancho completo, sin lienzo de
nodos.

## Por qué NO es un lienzo de nodos

No es cuestión de gusto y no se reabre:

- **El motor v1 es LINEAL.** Un `condition` que no pasa **termina** el run (`done`), no bifurca. Un
  rombo con dos salidas dibujaría semántica que el kernel no puede ejecutar: el editor estaría
  mintiendo, y la mentira solo se vería a las 3 de la mañana.
- **El lienzo en táctil está roto por diseño.** La issue **#1 de Node-RED** (2013, aún abierta) es
  «Mobile/Tablet support». ERPlora es un TPV: la tablet es dispositivo de primera clase.
- **Shopify Flow —producto para comerciantes— abandonó el lienzo** y migró a columna vertical
  (enero de 2026). La deriva del sector para el segmento no técnico va del lienzo a la lista.
- **Una columna sobrevive al reflow.** El asistente reserva `33vw` a partir de 768 px; unos nodos
  en (x, y) absolutas, no.

Por lo mismo: el reordenado es **`ion-reorder-group`** (gesto nativo de Ionic, pensado para el
dedo) y **nunca** la API de arrastre HTML5 que usa `ok-kanban` y que en táctil **no dispara**
([ERPlora/outfitkit#55](https://github.com/ERPlora/outfitkit/issues/55)).

## Cómo llega al kernel

`/api/hub/flows*` es **REST del core**, no el dispatcher, así que `query`/`command` no llegan.
La vía declarada es `client.forModule('flows').flows` (hub#714), y hacen falta **tres** cosas:

1. que el core **tenga** la superficie (si no: «este hub todavía no sabe automatizar»);
2. que el dueño haya concedido la capability **`manage_flows`** — se declara en `module.json` y se
   concede en Ajustes → Permisos (`capability_denied` → la pantalla dice qué activar);
3. una sesión local de **dueño/administrador** — un cajero recibe `403`, y ahí la respuesta es otra.

El contrato del documento **se pregunta, no se empotra**: `GET /api/hub/flows/schema` (hub#716). Un
módulo se actualiza por su cuenta, así que una copia sería la foto del hub contra el que se compiló.

## Qué entra en el editor hoy

| Pieza | Estado |
|---|---|
| Lista de flujos, activar/pausar, borrar | ✅ |
| Disparador `event` (catálogo verificado contra el hub) · `cron` diario · `at` · `manual` | ✅ |
| Steps `command`, `condition` (como **guardia**), `delay` (como **etiqueta del segmento**) | ✅ |
| Reordenar con `ion-reorder-group` | ✅ |
| Selector de datos con **valores reales** del hub (`GET /api/hub/events/shape`, hub#715) | ✅ |
| Conceder/retirar permisos (`grants`) desde la UI | ✅ |
| Historial de ejecuciones en lenguaje llano | ✅ |
| **Galería de plantillas por sector** — la entrada del módulo (flows#1) | ✅ |
| **Guía del dueño** dentro del módulo (pm#134) | ✅ |
| Steps `http` (URL, cabeceras, cuerpo, timeout) · `ai` (prompt, tools, policy) · `notify` (canal, destinatario, texto) | ✅ (flows#3) |
| **Secretos** write-only (`…/flows/secrets`) desde el propio step `http` | ✅ (flows#3) |
| **Bandeja de aprobación** (`…/approvals`) para los `ai` con `policy: manual` | ✅ (flows#3) |
| Permisos derivados de los cinco `kind` de grant, patrón de URL incluido | ✅ (flows#3) |
| **Borrador escrito por el asistente** — bandeja de propuestas (flows#4) | ✅ |
| **«Probar» antes de activar** contra el último evento REAL del hub, sin ejecutar nada (flows#2) | ✅ |

Un documento escrito por un editor **más nuevo** se abre igual, en solo lectura, y se guarda
intacto: pintarlo sin un step y después guardarlo es como se borra en silencio una automatización
que funcionaba.

## El borrador que escribe el asistente (flows#4)

La regla es dura y es de producto: **lo que escribe la IA nace BORRADOR, nunca un flujo activo.**
Aquí eso no es una política que alguien tenga que recordar, es **estructural**:

- El asistente **no puede** llamar a `/api/hub/flows`: esas rutas exigen sesión local de
  dueño/admin y rechazan el token de máquina, que es justo lo que lleva un turno del asistente.
- Lo que sí puede es llamar a un **command de este módulo** — `flows.drafts.propose`, expuesto
  como tool por su bloque `ai` —, que escribe una fila en `flows_flowdraft`. **Un borrador no es
  un flujo**: el kernel no lo conoce, `_flow_triggers` no puede apuntarle, `_flow_grants` no puede
  nombrarlo y ningún tick lo recoge.
- Se convierte en automatización cuando **una persona** pulsa el botón: entonces el navegador hace
  `POST /api/hub/flows` con `enabled: false` y **sin grants**, igual que una plantilla.

Lo que la IA propone se juzga **contra el contrato que sirve este hub** (`GET /api/hub/flows/schema`,
del que se leen las enums: versión, kinds, operadores, y que `tools` es un **objeto**, la trampa de
hub#786). Un documento que no lo cumpla se **rechaza entero con su frase**: no se abre «a medias».

Y como la evidencia dice que la IA **acierta el esqueleto y falla los parámetros** (Zapier lo
documenta de su propio Copilot: genera «a basic outline» y deja instrucciones), el borrador se abre
en la **misma espina vertical** con los huecos marcados en las tarjetas y listados arriba, más lo
que el propio asistente dice que no ha sabido decidir.

**Lo que el modelo puede PROPONER es más estrecho que lo que una persona puede CONSTRUIR.** Desde
flows#3 el editor termina los seis kinds, así que el motivo ya no es «el dueño no sabría
rellenarlo»: el esquema de la tool (`schemas/draft_propose.json`) admite solo `command`,
`condition` y `delay` porque un `http` llamaría a una URL que no eligió nadie, un `notify` cuesta
dinero por mensaje (Meta cobra cada WhatsApp) y un `ai` es otra llamada facturada. Los tres son
justo lo que el D3 del ADR-0283 deja en manual, y una propuesta es la evidencia más floja que hay.
El dueño los añade a mano, en la misma espina, una pantalla después.

## Estructura

```
module.json                 manifest (capability `manage_flows`, una entrada de navegación)
locales/{en,es}.json        catálogo i18n — inglés fuente + español completo (ADR-0055)
ui/lib/flow-doc.ts          el documento y el lenguaje de mapeo (puro, sin DOM)
ui/lib/plain-language.ts    todo lo que el dueño lee, en palabras
ui/lib/trigger-catalog.ts   los eventos que se ofrecen (el hub es la autoridad, no este fichero)
ui/lib/hub-flows.ts         la puerta al kernel + los tipos de la superficie
ui/lib/templates.ts         las plantillas de la galería (documento + huecos + permisos)
ui/lib/ai-draft.ts          lo que propuso el asistente: leerlo, juzgarlo y señalar sus huecos
migrations/postgres/        `flows_flowdraft` — las propuestas, que NO son flujos
commands/ · queries/        `flows.drafts.propose` (tool del asistente) · `.resolve` · `.list`
schemas/draft_propose.json  el contrato que se le entrega al modelo como parámetros de la tool
ui/components/erp-flows-app          la pantalla que monta el shell: puerta + lista + galería
ui/components/erp-flows-gallery      la galería por sector y el panel que explica una plantilla
ui/components/erp-flows-guide        la guía del dueño (vive aquí porque `docs/` NO viaja en el zip)
ui/components/erp-flows-editor       la espina vertical
ui/components/erp-flows-value        un valor compuesto de texto y pills
ui/components/erp-flows-field-picker el selector de datos, con ejemplos REALES
```

Sin handler WASM. Hasta flows#4 tampoco tenía `queries/`, `commands/` ni `migrations/`: la única
razón de que ahora los tenga es que el asistente necesita una puerta a la que llamar, y la del
kernel le está cerrada a propósito.

## Desarrollo

```sh
cd modules-workspace
npx vitest run modules/flows      # tests (happy-dom: se monta el WC y se mira lo que PINTA)
npx erplora contracts flows       # regenera .erplora/contracts.json  (commitear)
npx erplora build flows           # dist/flows.esm.js + dist/icons.json  (commitear)
npx erplora validate flows        # manifest + contratos + CSP
```

⚠️ `erplora dev` no sirve para este módulo: su cliente de preview no tiene `forModule` ni `flows`.
La pantalla lo dice («este hub todavía no sabe automatizar») en vez de romperse, pero para probar
de verdad hace falta un hub real con la capability concedida.
