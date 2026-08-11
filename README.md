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
| Steps `http` · `ai` · `notify` | 👀 se **abren en solo lectura** y se guardan intactos |
| Galería de plantillas · «Probar» antes de activar · borrador por IA | ⛔ fuera de esta entrega |

Un documento que este editor no sabe editar del todo **se abre igual**: pintarlo sin un step y
después guardarlo es como se borra en silencio una automatización que funcionaba.

## Estructura

```
module.json                 manifest (capability `manage_flows`, una entrada de navegación)
locales/{en,es}.json        catálogo i18n — inglés fuente + español completo (ADR-0055)
ui/lib/flow-doc.ts          el documento y el lenguaje de mapeo (puro, sin DOM)
ui/lib/plain-language.ts    todo lo que el dueño lee, en palabras
ui/lib/trigger-catalog.ts   los eventos que se ofrecen (el hub es la autoridad, no este fichero)
ui/lib/hub-flows.ts         la puerta al kernel + los tipos de la superficie
ui/components/erp-flows-app          la pantalla que monta el shell: puerta + lista
ui/components/erp-flows-editor       la espina vertical
ui/components/erp-flows-value        un valor compuesto de texto y pills
ui/components/erp-flows-field-picker el selector de datos, con ejemplos REALES
```

Sin `queries/`, sin `commands/`, sin `migrations/` y sin handler WASM: es el primer módulo
puramente de UI de los 25.

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
