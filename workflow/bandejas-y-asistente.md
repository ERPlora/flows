# WORKFLOW — Automatizaciones · Bandejas y asistente

Prefijo: FLOWS

## Flujos

### FLOWS-F24 Contestar una pregunta o una propuesta en espera
Estado: parcial — solo la contesta un administrador: el hub exige su sesión para ver y decidir, así que la persona del rol al que se preguntó no tiene dónde contestar
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En **Automatizaciones**, la bandeja **Pendiente de ti** enseña cada cosa que espera:
   - una **pregunta** de un paso «Preguntar antes a alguien»: su texto y detalles, a quién se preguntó
     («Preguntado a: …. Quien administra el hub también puede contestar.» o «Preguntado a quien
     administra el hub.»), qué pasa si nadie contesta («Si nadie contesta antes del …, cuenta como un
     no.» / «…la automatización se para aquí.» / «…la automatización sigue igualmente.») y qué significa
     un no;
   - una **propuesta** del asistente: «Quiere ejecutar …», su motivo, los datos tal cual, y «Si no haces
     nada, esto caduca el … y no se ejecuta.».
2. Si quieres, escribe en «Añadir una nota (opcional)».
3. Pulsa **Aprobar** o **No**. La tarjeta sale de la bandeja.
Entra: lo que espera en el hub (hasta 100), con lo que se preguntó ya rellenado en su momento.
Sale: la decisión, con quién la tomó (de la sesión) y la nota. Aprobar una propuesta ejecuta exactamente
lo propuesto, comprobando el permiso en ese momento; aprobar una pregunta no ejecuta nada y la
automatización sigue. Un no o el silencio hacen lo que se eligió en el paso (FLOWS-F18). Todo queda en el
historial de la ejecución.
Si falla: la tarjeta se queda y sale «Demasiado tarde: esta caducó antes de que contestaras. No se ha
hecho nada.», «Alguien ya contestó a esta. No se ha hecho nada dos veces.» o el mensaje del hub. Aprobar
una propuesta de una automatización en pausa se niega (`flow.disabled`): no se hace nada y la tarjeta se
queda hasta encenderla o rechazarla; hoy la bandeja enseña el motivo del hub en inglés (ERPlora/flows#166).
Implicados: HUB-F100, HUB-F101, HUB_SHELL-F93
QA: qa-hub-flows R6

### FLOWS-F25 Reenviar o cerrar lo que no llegó a pasar
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En **Automatizaciones**, la bandeja **Necesita tu atención** («Esto no llegó a pasar. Decide qué
   hacer con cada uno.») enseña cada aviso del negocio que el hub no consiguió entregar tras sus
   reintentos (los que fallan por un permiso, por el cupo agotado o porque se retiró el permiso de la
   automatización llegan al primer intento): «… no llegó a salir», por qué y qué hacer, de qué módulo vino, cuántos intentos, cuándo,
   su referencia (**Copiar la referencia**), su contenido y el texto técnico plegado.
2. **Volver a enviarlo** lo devuelve a la cola de envío. Con más de uno reenviable sale también **Volver a
   enviar los N**.
3. Si el permiso que necesitaba se retiró mientras esperaba, no hay botón de reenviar: «Le quitaste el
   permiso que necesitaba mientras seguía esperando…» y «Vuelve a concederlo en Permisos y lanza la
   automatización. Reenviar este fallaría por lo mismo.».
4. **Cerrarlo** pregunta «¿Cerrarlo para siempre? Deja de contar y ya nadie volverá a enviarlo.», con
   tres motivos de un toque («Duplicado», «Ya resuelto a mano», «Ya no aplica») y «¿Por qué lo cierras?»
   (opcional, 500 caracteres). **Sí, cerrarlo** o **Cancelar**.
5. Lo cerrado sale debajo en «Cerrados ahora mismo» con el motivo que guardó el hub.
Entra: la cola de avisos caídos de todo el negocio (no solo los de automatizaciones), que es la misma que
el hub enseña en «Eventos caídos».
Sale: el aviso devuelto a la cola de envío (que vuelve a intentarlo; si la causa sigue, vuelve aquí), o
cerrado: deja de reintentarse para siempre. El hub guarda quién lo cerró, cuándo y por qué durante 90
días y después borra el evento (la pantalla lo dice: «El hub guarda quién cerró cada uno, cuándo y por
qué durante noventa días.»). Lo que sigue atascado sin decidir no se borra nunca.
Si falla: la fila se queda y sale el motivo («Le quitaste el permiso…», «Automatizaciones no tiene permiso
para ver lo que se ha atascado…» o el mensaje del hub).
Implicados: PRINTING-F16, HUB-F53, HUB-F54, HUB-F55, HUB-F56, HUB-F57, HUB-F191, HUB-F266, HUB_SHELL-F145, HUB_SHELL-F146, HUB_SHELL-F147, HUB_SHELL-F148, HUB-F52
QA: qa-hub-flows R8, BD-10

### FLOWS-F26 Pedirle al asistente una automatización
Estado: hecho
Vertical: comun
Actor: administrador, asistente
Pantalla: asistente
Pasos:
1. Un administrador le pide al asistente algo que pase solo («cuando alguien no venga, recuérdame
   llamarle»).
2. El asistente escribe un **borrador**: nombre, un disparador como mucho, de uno a ocho pasos de «hacer
   algo», «solo sigue si» o «esperar», y las notas de lo que no supo decidir.
3. Antes de guardarlo sale la tarjeta «El asistente quiere ejecutar una acción», que en vez del nombre
   de la acción dice «Una acción que esta app no sabe nombrar» (el módulo no publica el nombre de su
   orden en la traducción); la persona la confirma.
4. Contesta que lo ha dejado esperando en Automatizaciones y repite sus dudas.
5. El borrador aparece en **Propuestas por el asistente** la próxima vez que se abre Automatizaciones
   (FLOWS-F27).
Entra: lo que la persona pide en la conversación; los nombres de acciones que el asistente conoce de
este negocio.
Sale: un borrador pendiente en el módulo, y el aviso `flows.draft.proposed` (que hoy no escucha nadie).
No crea ninguna automatización, no concede permisos y no ejecuta nada.
Si falla: el hub rechaza un borrador que no sigue la forma pedida antes de guardarlo; sin el permiso de
gestionar automatizaciones (de fábrica, solo el perfil administrador) el asistente no tiene esa orden y
contesta que no puede. Si el asistente se inventa un nombre de acción, el editor lo guarda igual: se
descubre al conceder su permiso o al ejecutarse (FLOWS-F14).
Implicados: HUB-F273, HUB-F274, HUB_SHELL-F190
QA: ninguno

### FLOWS-F27 Revisar un borrador del asistente y crearlo
Estado: parcial — si se enciende el interruptor antes de guardar, el borrador nace encendido; y si falla marcar el borrador como usado, vuelve a la bandeja y se puede crear dos veces
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En **Propuestas por el asistente**, cada borrador lleva su nombre y «Borrador». Si no cumple lo que
   este hub sabe ejecutar, lleva el motivo debajo (por ejemplo «No tiene pasos, así que no haría nada.»)
   y solo se puede descartar.
2. Pulsa **Revisar**: se abre en el editor como una automatización que todavía no existe, con el recuadro
   «Esto es un borrador que escribió el asistente. Está apagado, no tiene permisos y no pasa nada hasta
   que lo actives tú.», «Revisa esto antes de activarla» (lo que falta: «Di qué tiene que pasar para que
   esto arranque.», «Este hub nunca envía «…». Elige algo que sí ocurra aquí.», ««…» está vacío.»…)
   y «Lo que el asistente no ha podido decidir». Las tarjetas con hueco quedan marcadas.
3. Corrige y completa los pasos (FLOWS-F13, FLOWS-F14).
4. Pulsa **Guardar**: se crea la automatización (en pausa si no se ha tocado el interruptor) y el borrador
   sale de la bandeja como usado.
5. Concede sus permisos (FLOWS-F19), pruébala (FLOWS-F20) y enciéndela (FLOWS-F21).
Entra: los borradores pendientes (los 50 más recientes), juzgados contra lo que este hub dice que sabe
ejecutar.
Sale: una automatización nueva sin permisos, y el borrador marcado como usado con el enlace a ella.
Salir con ← sin guardar deja el borrador en la bandeja.
Si falla: si el hub no la acepta al guardar, el mensaje en rojo y no se crea nada.
Implicados: HUB-F80, HUB-F111
QA: ninguno

### FLOWS-F28 Descartar un borrador del asistente
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En **Propuestas por el asistente**, pulsa × («Descartar») en el borrador.
2. Sale de la bandeja al momento, sin pregunta.
Entra: el borrador elegido.
Sale: el borrador marcado como descartado; se conserva como registro de que el asistente lo propuso.
Si falla: el mensaje en rojo arriba; el borrador vuelve a aparecer la próxima vez que se abre la
pantalla. Uno ya decidido no se puede volver a decidir.
Implicados: ninguno
QA: ninguno

### FLOWS-F29 Otro módulo pregunta si una automatización ya está montada
Estado: hecho
Vertical: comun
Actor: sistema
Pantalla: ninguna
Pasos:
1. Un módulo que ofrece un atajo hacia Automatizaciones pregunta con un aviso y una acción: «¿hay
   automatizaciones que arrancan con este aviso y pueden hacer esta acción?».
2. Recibe tres números: cuántas hay, cuántas de esas están encendidas, y cuántas escuchan ese aviso pero
   no tienen todavía ningún permiso de acción (a medio montar).
Entra: el nombre del aviso y de la acción; exige el permiso de ver automatizaciones (de fábrica, solo el
administrador).
Sale: tres números del negocio; ningún nombre ni contenido.
Si falla: sin el permiso, se rechaza; un módulo `flows` anterior a esta consulta contesta que no existe.
Hoy no la usa ningún módulo en `origin/main`. El asistente también puede consultarla: está ofrecida como
herramienta.
Implicados: ninguno
QA: ninguno
