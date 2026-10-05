# WORKFLOW — Automatizaciones · Editor

Prefijo: FLOWS

## Flujos

### FLOWS-F12 Crear una automatización desde cero
Estado: parcial — nace «Solo a mano» y no hay botón para ejecutarla (FLOWS-F22); al guardar no sale ningún aviso de que se ha guardado (leído en el código, sin ejecutar); y la flecha de volver tira lo que no se guardó sin preguntar
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. En **Automatizaciones** pulsa **Nueva automatización**.
2. Se abre el editor vacío: sin nombre («Automatización sin nombre»), «En pausa», el disparador «Solo
   cuando pulses Ejecutar» y «Todavía no hay pasos. Añade lo primero que debe hacer esta
   automatización.».
3. Escribe el nombre, elige cuándo arranca (FLOWS-F13) y añade los pasos (FLOWS-F14).
4. Pulsa **Guardar**: el botón pasa a «Guardando…» y vuelve a «Guardar», sin otro aviso; el hub la crea
   y el editor sigue abierto sobre ella; ya se pueden conceder sus permisos (FLOWS-F19).
5. ← vuelve a la lista y la recarga.
Entra: lo que se escribe y se elige.
Sale: una automatización nueva, en pausa salvo que se haya encendido el interruptor antes de guardar
(FLOWS-F21), y sin permisos. Sin nombre se guarda como «Automatización sin nombre».
Si falla: el mensaje del hub en rojo encima de la pestaña (por ejemplo, una acción que no existe o un
horario imposible), y no se guarda nada. Pulsar ← antes de **Guardar** pierde lo hecho sin aviso.
Implicados: pendiente
Pendiente de enlazar: hub — crear una automatización: el hub valida el documento entero al guardar
QA: qa-hub-flows R1, BD-10

### FLOWS-F13 Elegir cuándo arranca
Estado: parcial — el filtro del propio disparador («solo cuando el total pase de…») no se puede escribir ni ver; se conserva, también si se cambia el aviso o el tipo de disparador, y Probar lo tiene en cuenta; y la lista de avisos no tiene buscador (flows#50)
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. En **Pasos**, toca la tarjeta «Cuando pase esto…» y elige en el desplegable:
   - «Pasa algo»: en «Elige qué pasa», los avisos de este negocio agrupados por módulo y dichos en
     palabras («se cobra una venta», «alguien no se presenta», «llega un WhatsApp», «alguien pide
     vacaciones», «un cliente retira su consentimiento», «hay algo que imprimir»…). Debajo, cuántos
     ejemplos recientes tiene («N ejemplos recientes» o «Aún no hay ejemplos: aquí no ha pasado nada así
     en los últimos 90 días»). En «Otro evento» se puede escribir el nombre técnico a mano.
   - «Según un horario»: «Cada cuánto» («Todos los días», «Todas las semanas», «Todos los meses»), el
     día de la semana o del mes si toca, y «Hora». Se lee en la hora del negocio. Un horario más
     complicado que estos tres se enseña tal cual («Este horario tiene más detalle del que esta
     pantalla sabe dibujar…») y solo cambia con **Cambiarlo por un horario sencillo**.
   - «Una vez, en una fecha y hora»: «Fecha y hora», con la hora del dispositivo.
   - «Solo a mano»: nada más (ver FLOWS-F22).
2. La tarjeta resume lo elegido («Cuando se cobra una venta», «Todos los viernes a las 18:00»…).
3. Se guarda con **Guardar** (FLOWS-F21).
Entra: la lista de avisos que da el hub (los que declaran los módulos instalados y los que ha visto
pasar en 90 días) y sus ejemplos. Un aviso sin frase propia sale con una frase compuesta o con su
nombre técnico. Tienen frase escrita a mano, entre otros, la ficha nueva y el consentimiento de
Clientes, la ausencia de Personal, «hay algo que imprimir», la mesa abierta, cerrada, trasladada,
fusionada o dividida de Mesas, la comanda nueva y la lista de Cocina y el artículo que cruza su mínimo
de Inventario (los flujos de Implicados).
Sale: el disparador en el documento; el hub lo arma al guardar. Un filtro que ya traía se queda aunque
se elija otro aviso, sin que se vea.
Si falla: si el hub no da la lista, se dice por qué y queda la casilla de texto: «Preguntando a este hub
qué eventos puede lanzar…», «Este hub es demasiado antiguo para listar sus eventos…», «Este hub todavía
no tiene ningún evento…», «Automatizaciones aún no puede leer los eventos de este hub…» o «Este hub no ha
podido listar sus eventos (…)». Un aviso que el hub no conoce dice «Este hub no lo tiene — lo trae el
módulo …». Un horario o fecha imposibles los rechaza el hub al guardar.
Implicados: CUSTOMERS-F01, CUSTOMERS-F14, CUSTOMERS-F15, INVENTORY-F18, KITCHEN-F05, KITCHEN-F11, PRINTING-F16, STAFF-F17, TABLES-F10, TABLES-F15, TABLES-F16, TABLES-F17, TABLES-F18, TABLES-F21
Pendiente de enlazar: hub — catálogo de avisos y ejemplos reales; horario en la zona del negocio; rechazo de horarios imposibles al guardar
QA: qa-hub-flows R0, qa-hub-flows R2

### FLOWS-F14 Añadir, ordenar y rellenar los pasos
Estado: parcial — el nombre de la acción y de la consulta se escribe a mano (no hay lista donde elegirlo); no se puede esperar hasta una fecha que traiga el aviso, ni ver ni cambiar en **Pasos** el «solo si» y el «seguir si falla» de un paso (el hub los admite y la pantalla los conserva; **Probar** sí avisa cuando un paso se saltaría por su «solo si»)
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Pulsa un botón de añadir; el paso aparece al final, abierto. Arrastra el asa para cambiar el orden;
   × lo quita al momento.
2. Rellena su formulario:
   - **Hacer algo**: «Qué ejecutar» (el nombre de una acción del negocio, por ejemplo
     `sales.sale.create`) y «Con esta información»: pares «Nombre» / «Valor» con **Añadir
     información**.
   - **Consultar algo**: «Qué consultar», sus datos, «Qué guardar» («La primera fila que encuentre,
     campo a campo» o «Solo cuántas hay») y «Como mucho estas filas» (de 1 a 200). Si no encuentra
     nada, la automatización sigue; para pararla, se añade después un «Solo sigue si».
   - **Solo sigue si…**: una o varias filas «Dato», «Es» («igual a», «distinto de», «uno de», «está
     presente», «contiene», «mayor que»…) y «Valor», con **Añadir una condición**. Si no se cumple, la
     automatización termina ahí sin error. Para comprobar a qué pregunta de WhatsApp contesta el cliente,
     «Elige la pregunta» lista las que hacen las automatizaciones del negocio.
   - **Esperar**: «Cuánto» y la unidad (minutos, horas o días), contado desde el paso anterior.
3. En cada «Valor», **Insertar un dato** abre «¿Qué dato?», con los datos del aviso y un ejemplo real
   de este negocio al lado; se elige, no se escribe. Una lista no se ofrece («no se ofrece: es una
   lista…») y un ejemplo que puede ser de una persona sale oculto.
4. Los pasos de mensaje, otro sistema, asistente y pregunta se rellenan en FLOWS-F15 a FLOWS-F18.
5. **Guardar** (FLOWS-F21).
Entra: los datos del aviso elegido y sus ejemplos (solo con disparador «Pasa algo»; sin aviso no hay
nada que insertar).
Sale: el documento de pasos. Cada acción, consulta, canal o dirección que se nombra pasa a pedir su
permiso (FLOWS-F19).
Si falla: el hub rechaza al guardar una acción o una consulta que no existen y lo dice en rojo. Un
paso de un tipo que este editor no conoce se enseña con «Este paso sigue funcionando. Editarlo
necesita una versión más nueva de este módulo.» y se guarda intacto.
Implicados: WHATSAPP_INBOX-F19
Pendiente de enlazar: hub — tipos de paso, datos de un aviso con ejemplos, «solo si toca» y «seguir si falla» por paso
QA: qa-hub-flows R1, BD-10

### FLOWS-F15 Mandar un mensaje a un cliente desde una automatización
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Pulsa **Enviar un mensaje** y elige «Por dónde sale»: «Email» o «WhatsApp» (con WhatsApp sale «Meta
   cobra cada WhatsApp. Un email no cuesta nada.»).
2. En «A quién le llega» escribe de qué consulta sale la dirección («Sácala de») y «De qué columna»: no
   hay casilla para escribir una dirección («La dirección se lee de tus propios datos y aquí no se puede
   escribir a mano…»).
3. En WhatsApp elige la «Plantilla» entre las aprobadas por Meta del negocio («Sin plantilla — texto
   libre (solo últimas 24 horas)»), su archivo de cabecera si la plantilla lo lleva (subir imagen, vídeo
   o PDF) y, si el hub lo admite, «Qué es este mensaje»: «Algo que les cuentas» o «Algo que tocan»
   (botones o una lista de opciones). En email, «Nombre de la plantilla» hace de asunto.
4. Escribe «El mensaje», con datos insertados.
5. **Guardar** y concede los dos permisos que pide: el canal y a quién (FLOWS-F19).
Entra: las plantillas aprobadas de la Bandeja de WhatsApp (si no está instalada o falla, se escribe el
nombre a mano: «No se han podido leer tus plantillas de WhatsApp…»).
Sale: el paso en el documento. Al ejecutarse, el hub deja el mensaje en cola («Mensaje de WhatsApp en
cola para mandarse» en el historial): que salga de verdad se decide después, y si no llega a salir
acaba en «Necesita tu atención» (FLOWS-F25).
Si falla: avisos en el propio paso («“…” no está entre tus plantillas aprobadas: WhatsApp no la
enviará…», «Esa imagen pesa más de 5 MB…», «Esta plantilla lleva arriba: … y este hub todavía no puede
enviarlo…»).
Implicados: WHATSAPP_INBOX-F01, WHATSAPP_INBOX-F27
Pendiente de enlazar: hub — paso de mensaje: destinatario leído de una consulta, cola de envío y permisos de canal y destinatario
QA: qa-hub-flows R7

### FLOWS-F16 Llamar a otro sistema y guardar sus claves
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Pulsa **Llamar a otro sistema**: «Método», «Dirección» (debajo, «Este paso te pedirá permiso para
   llamar a …»), «Cabeceras» con **Añadir una cabecera**, «Qué enviar» y «Rendirse a los» (segundos,
   30 como mucho).
2. En la caja «Secretos» del propio paso escribe «Nombre» y «Valor» y pulsa **Guardar**: «… guardado. Su
   valor ya no se puede volver a mostrar.». × lo borra.
3. En una cabecera, «Insertar un secreto» lo pone sin enseñarlo.
4. **Guardar** la automatización y concede el permiso de esa dirección (FLOWS-F19).
Entra: la lista de nombres de secretos del negocio (nunca sus valores).
Sale: el secreto cifrado en el hub, compartido por todas las automatizaciones del negocio; el paso con
la dirección y las cabeceras.
Si falla: el mensaje del hub en rojo. Borrar un secreto que usa otra automatización hace que su paso
falle al ejecutarse; la pantalla no pregunta antes.
Implicados: pendiente
Pendiente de enlazar: hub — paso de llamada a otro sistema, secretos que no se pueden leer y permiso por patrón de dirección
QA: qa-hub-flows R5

### FLOWS-F17 Pedirle un paso al asistente
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Pulsa **Pedírselo al asistente** y escribe «Qué pedirle», con datos insertados (no claves: «No pongas
   aquí nunca una clave ni una contraseña…»).
2. En «Qué puede mirar y qué puede hacer» añade lo que «Puede leer» y lo que «Puede proponer» (nombres
   escritos a mano). Ofrecérselo no se lo permite: hay que concederlo en Permisos.
3. En «Antes de cambiar nada» elige «Que me lo pregunte» (de fábrica: lo que quiera cambiar espera en
   «Pendiente de ti», FLOWS-F24) o «Que lo haga por su cuenta» (sale el aviso de que cambiará datos sin
   que nadie lo mire).
4. «Cuántas vueltas puede dar» (10 como mucho; cada vuelta es una llamada que cuesta dinero).
Entra: lo que se escribe.
Sale: el paso; al ejecutarse, el hub llama al asistente y, con «Que me lo pregunte», deja la propuesta en
la bandeja sin ejecutarla.
Si falla: el hub rechaza al guardar un secreto en el texto o más vueltas de las permitidas.
Implicados: pendiente
Pendiente de enlazar: hub — paso del asistente: herramientas que se le ofrecen, propuesta a la bandeja y coste por llamada
QA: qa-hub-flows R6

### FLOWS-F18 Hacer que una automatización pregunte antes a alguien
Estado: parcial — el rol elegido en «Quién tiene que contestar» no cambia nada: solo un administrador puede abrir la bandeja y contestar
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Pulsa **Preguntar antes a alguien** y escribe «La pregunta» y, si quieres, «Detalles (opcional)», con
   datos insertados. Se rellenan en el momento de preguntar.
2. «Quién tiene que contestar»: un rol (sugiere `admin`, `manager`, `employee`); vacío es «Quien
   administra el hub».
3. «Cuánto esperar la respuesta»: de una hora a 30 días (de fábrica, tres días).
4. «Si dicen que no»: «Parar la automatización aquí» o «Seguir con los pasos siguientes». «Si nadie
   contesta a tiempo»: «Contarlo como un no», «Parar la automatización aquí» o «Seguir con los pasos
   siguientes». Con «Seguir», el aviso explica cómo poner después un «Solo sigue si» sobre la respuesta.
Entra: lo que se escribe.
Sale: el paso. Al ejecutarse, la pregunta espera en «Pendiente de ti» (FLOWS-F24) y la automatización se
para ahí hasta que contestan o vence el plazo. Este paso no pide permiso.
Si falla: el hub rechaza un plazo de más de 30 días o una pregunta vacía al guardar.
Implicados: pendiente
Pendiente de enlazar: hub — paso de pregunta: rol, plazo, qué pasa con un no y con el silencio
QA: qa-hub-flows R6, BD-10

### FLOWS-F19 Conceder, limitar y retirar los permisos de una automatización
Estado: parcial — antes del primer guardado «Autorizar todo lo que necesita» no hace nada y no lo dice; un permiso «Dañado» cuenta como concedido para «Probar» y para el interruptor (flows#156); las filas dicen el nombre técnico de la acción
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Abre **Permisos** (se abre sola al crear desde la galería si la tarjeta pide alguno).
2. Lee la lista, sacada de los propios pasos: cada acción, cada consulta, cada canal y destinatario de
   mensaje y cada dirección externa. Lo que falta sale como «Pendiente de tu permiso»; lo concedido,
   «Autorizado»; un permiso cuyo límite está estropeado, «Dañado» con «Retíralo y vuelve a
   autorizarlo…».
3. Pulsa **Autorizar todo lo que necesita**: sale «Permisos actualizados.».
4. Para acotar una acción o una consulta concedida pulsa «Límites»: filas «Campo» / «Tiene que ser»,
   **Añadir un límite** y **Guardar límites**. Un límite puede ser un valor fijo o algo que la propia
   automatización averigua (`steps.…`). La fila pasa a decir «— solo con …».
5. **Retirar** quita un permiso al momento, sin preguntar.
Entra: los pasos (también los no guardados) y los permisos que el hub dice que tiene.
Sale: la lista completa de permisos de la automatización, que el hub guarda entera cada vez.
Si falla: «Este hub no tiene ningún comando llamado …. Revisa el nombre en el paso.»; un límite mal
escrito se para antes de enviarlo («“…” nombra algo que esta automatización no tiene…»); cualquier otro
rechazo, el mensaje del hub. Si los permisos no se pueden leer, todo sale como pendiente.
Implicados: pendiente
Pendiente de enlazar: hub — permisos de una automatización (lista completa, acciones que existen, límites fijados y filas dañadas)
QA: qa-hub-flows R3, BD-10

### FLOWS-F20 Probar una automatización sin que haga nada
Estado: parcial — no lee de verdad las consultas (su resultado sale como desconocido), con horario o a mano no hay ejemplo con el que probar, y un permiso «Dañado» no avisa de que ese paso se rechazaría (flows#156)
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Pulsa **Probar** (cabecera) o la pestaña **Probar**.
2. Arriba: «Nada de esto es real. No se envía ningún mensaje, no se cobra nada y no se apunta nada: esto
   es solo lo que HARÍA tu automatización.» y con qué datos prueba («Con lo que pasó de verdad la última
   vez que …») o «Esto no ha pasado en tu hub últimamente…».
3. Paso a paso dice qué haría y con qué valores, y señala: lo que «saldría vacío» (y el total arriba),
   «Ni siquiera arrancaría…», una condición que la pararía («Se pararía aquí, y eso es la automatización
   funcionando…»), un paso que se saltaría por su «solo si» («Esta vez se salta…» / «Podría
   saltarse…»), lo que no puede saber («Esto no se puede comprobar aquí…», «sale de un paso
   anterior…»), una pregunta («Espera aquí a que alguien conteste…») y un paso sin permiso («Se lo
   rechazarían: todavía no le has permitido …»).
4. Abrir esta pestaña quita del interruptor el aviso de «Todavía no la has probado».
Entra: los ejemplos reales que el hub ha visto de cada dato del aviso (no un aviso entero); los permisos
concedidos.
Sale: nada: no ejecuta, no guarda, no llama al hub más allá de leer los ejemplos.
Si falla: sin ejemplos lo dice y enseña los pasos sin valores.
Implicados: pendiente
Pendiente de enlazar: hub — ejemplos reales de un aviso, con los datos de personas ocultos
QA: qa-hub-flows R0, qa-hub-flows R1

### FLOWS-F21 Guardar y encender una automatización desde el editor
Estado: parcial — el interruptor del editor no se guarda hasta pulsar **Guardar** y ← lo pierde sin avisar; al guardar no sale ningún aviso de que se ha guardado (leído en el código, sin ejecutar)
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Mueve el interruptor de la cabecera: la etiqueta pasa a «Activa».
2. Si le faltan permisos sale «Encendida, pero aún no tiene los permisos que pide (…): no hará nada hasta
   que se los concedas en la pestaña Permisos.»; si no se ha abierto **Probar**, «Todavía no la has
   probado…». No impide encenderla.
3. Pulsa **Guardar** («Guardando…»); vuelve a «Guardar» sin otro aviso.
4. Desde ese momento el hub la dispara cuando toque.
Entra: el nombre, el interruptor y el documento entero.
Sale: la automatización guardada; el hub vuelve a validarla y a armar sus disparadores (un horario que no
cambió conserva su reloj).
Si falla: el mensaje del hub en rojo, que dice qué no encaja; no se guarda nada.
Implicados: pendiente
Pendiente de enlazar: hub — guardar una automatización (valida y arma disparadores)
QA: qa-hub-flows R1, qa-hub-flows R10

### FLOWS-F22 Ejecutar una automatización a mano
Estado: no hecho — no hay botón «Ejecutar ahora»: una automatización «Solo a mano» («Solo cuando pulses Ejecutar») no se puede lanzar desde la pantalla
Vertical: comun
Actor: administrador
Pantalla: ninguna
Pasos:
1. Hoy solo por la API del hub (`POST /api/hub/flows/{id}/run`), con sesión de administrador, sobre una
   automatización encendida. Ni esta pantalla ni el asistente la pueden lanzar.
2. La ejecución empieza y su resultado aparece en **Historial** (FLOWS-F23).
Entra: la automatización y, si se quiere, los datos de entrada.
Sale: una ejecución real, con todos sus efectos (el hub no tiene modo de prueba; para eso está FLOWS-F20).
Si falla: el hub rechaza lanzar una automatización pausada.
Implicados: pendiente
Pendiente de enlazar: hub — lanzar una ejecución a mano
QA: qa-hub-flows R2 (discrepa)

### FLOWS-F23 Ver qué hizo una automatización y por qué falló
Estado: parcial — solo enseña las 20 ejecuciones más recientes, sin «ver más», y una ejecución fallida no se puede reintentar ni reanudar desde el paso que falló (hub#952)
Vertical: comun
Actor: administrador
Pantalla: Editor de automatización
Pasos:
1. Abre la automatización y la pestaña **Historial** (se vuelve a leer cada vez que se abre).
2. Sin ejecuciones: «Todavía no se ha ejecutado.». Si alguna se paró por error, arriba sale «Necesita a
   alguien» con «N ejecuciones se pararon por un problema».
3. Cada ejecución: su estado («Terminó bien», «Se paró por un error», «Esperando», «Esperando a que lo
   apruebes», «Cancelada», «En marcha»), el día y la hora, ⧉ («Copiar la referencia»: «Copiada. Pégala si
   nos preguntas por esta ejecución.») y ▾ para desplegar sus pasos en palabras («Ejecutó …», «Encontró
   N», «No encontró nada, y siguió», «Alguien dijo que sí», «La condición no se cumplió, así que terminó
   aquí. Eso es la automatización funcionando.», «Mensaje de WhatsApp en cola para mandarse»…) con lo que
   tardó cada uno.
4. Una parada por error dice qué pasó y qué hacer («Ha intentado hacer algo que no le has autorizado, así
   que ha parado.» / «Abre Permisos y concédele lo que necesita…»), con «El texto técnico, para soporte»
   plegado; si el error es del módulo que ejecutó la acción, sale su frase tal cual.
Entra: las ejecuciones que guarda el hub (90 días).
Sale: nada.
Si falla: el mensaje del hub en rojo encima de la pestaña.
Implicados: pendiente
Pendiente de enlazar: hub — historial de ejecuciones con sus pasos, retención de 90 días y reanudar desde el paso fallido (hub#952)
QA: qa-hub-flows R1, qa-hub-flows R8, BD-10
