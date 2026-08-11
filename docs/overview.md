# flows — visión general

Editor visual del kernel de automatización del Hub (ADR-0283 · `architecture/hub/flows.md`).
El motor vive en el core y está congelado; este módulo es **producto**: lo que el dueño ve y toca.

## El modelo mental que impone la pantalla

Dos frases, y la diferencia entre ellas es el error de modelo mental nº 1 documentado en toda la
literatura de trigger-action programming (Huang & Cakmak, UbiComp 2015):

- **«Cuando pase…»** — el disparador. Un **evento**: instantáneo, ocurre y se acabó.
- **«Solo sigue si…»** — la guardia. Un **estado**: se cumple o no en ese momento.

Por eso la guardia se dibuja como un chip que **estrecha** la espina y nunca como un rombo: si no
se cumple, el flujo **termina** (`done`), no se va por otra rama. No hay otra rama.

Y la espera (`delay`) es una **etiqueta sobre la línea** («… espera 3 días …»), no una tarjeta:
esperar no es hacer algo, es el tiempo que pasa entre dos cosas.

## Las tres puertas

Una automatización actúa en nombre del negocio sin que nadie mire, así que llegar a ella cuesta
tres permisos distintos, y cada uno falla de una forma distinta — por eso cada uno tiene su frase:

| Falta | El hub responde | La pantalla dice |
|---|---|---|
| La superficie de flujos en el core | (no existe `client.flows`) | «Este hub todavía no sabe automatizar» |
| La capability `manage_flows` | `capability_denied` | «Ve a Ajustes → Permisos y activa…» |
| La sesión de dueño/admin | `403 forbidden` | «Solo el dueño o un administrador…» |

## El mapeo de datos

Lo difícil no es arrastrar cajas: es decir que el `total` de la venta va en el importe del mensaje.
El selector se construye con **datos reales de este hub** (`GET /api/hub/events/shape`, hub#715):
el dueño elige «Total de la venta — 42,50 €», no `sale.total`. La ruta vive **solo en el modelo**;
`{{…}}` no aparece en pantalla nunca, y no hay «modo expresión» al que se pueda llegar sin querer.

Un ejemplo que el hub oculta (podría ser de una persona) **no oculta su campo**: `customer.email`
se sigue ofreciendo, sin ejemplo y diciendo por qué.
