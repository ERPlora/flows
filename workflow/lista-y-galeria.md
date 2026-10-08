# WORKFLOW — Automatizaciones · Lista y galería

Prefijo: FLOWS

## Flujos

### FLOWS-F01 Entrar en Automatizaciones
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. Abre **Automatizaciones** en el menú. Mientras carga sale «Cargando…».
2. La pantalla pregunta al hub qué versión de automatizaciones usa y después lista las del negocio.
3. Si todo está en orden, aparecen las bandejas que tengan algo, la lista y la galería.
4. Si algo falta, en vez de la pantalla sale un solo aviso que dice qué:
   - «Este hub todavía no sabe automatizar» — el hub no tiene motor de automatizaciones, o su formato
     no coincide con el del módulo.
   - «Este editor necesita tu permiso» — falta conceder «Administrar automatizaciones» a
     Automatizaciones en Ajustes → Permisos; el texto lo dice.
   - «Solo el dueño o un administrador puede editar automatizaciones» — la sesión no es de
     administrador.
Entra: la sesión del puesto y lo que el hub contesta (versión, automatizaciones).
Sale: nada guardado.
Si falla: cualquier otro rechazo sale en rojo con el mensaje del hub, o «Algo ha fallado. No se ha
guardado nada.»; hay que salir y volver a entrar. Si el hub usa un formato **más nuevo** que el módulo,
el aviso también dice que se actualice el hub (ver «Fuentes contrastadas» del índice).
Implicados: HUB-F32, HUB-F111, HUB-F136, HUB-F151, HUB_SHELL-F167
QA: qa-hub-flows R0, qa-hub-flows R3, BD-10

### FLOWS-F02 Ver, buscar y ordenar las automatizaciones del negocio
Estado: parcial — el buscador solo encuentra por el nombre y por el nombre técnico del aviso o de la acción (no por la frase que se ve), y la fila no dice cuándo se ejecutó por última vez
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En **Tus automatizaciones** cada fila dice el nombre, cuándo arranca en palabras y si está «Activa»
   o «En pausa».
2. Escribe en el buscador o elige en «Ver» («Encendidas y en pausa», «Solo las encendidas», «Solo las
   que están en pausa»), en «Arranca con» («Cualquier cosa», «Algo que pasa», «El reloj», «Una fecha»,
   «Tú, a mano») y en «Orden» («Tocadas al final», «Nombre»).
3. El recuento «Se ven N de M» dice cuántas quedan a la vista.
4. Si no queda ninguna: «Aquí no hay nada que encaje con eso.» y **Volver a verlas todas**, que quita
   la búsqueda y los dos filtros (no el orden).
5. Toca una fila para abrirla en el editor.
Entra: todas las automatizaciones del negocio, de una vez (también las que encendió otro módulo con su
receta de fábrica).
Sale: nada guardado; el filtro dura mientras la pantalla está abierta.
Si falla: si la lista no se puede leer, la pantalla entera da el aviso de FLOWS-F01.
Implicados: WHATSAPP_INBOX-F14, WHATSAPP_INBOX-F15, HUB-F81
QA: qa-hub-flows R10

### FLOWS-F03 Encender o pausar automatizaciones desde la lista
Estado: parcial — encender desde la lista no avisa de los permisos que le faltan: una automatización sin permisos queda «Activa» y no hace nada
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. Mueve el interruptor de una fila: se guarda al momento y la etiqueta pasa a «Activa» o «En pausa».
2. Para varias: marca sus casillas; sale la barra «N elegidas» con **Encenderlas**, **Ponerlas en
   pausa** y × («Soltarlas»).
3. Pulsa una de las dos: se aplica a cada elegida, una tras otra, y la selección se suelta.
4. Filtrar o buscar suelta las elegidas que dejan de verse.
Entra: la automatización entera (el hub la vuelve a validar al guardarla).
Sale: la automatización encendida o pausada. Al pausarla, lo pendiente y lo que está en curso se
cancelan en su siguiente paso, y una espera, solo al despertar (si se vuelve a encender antes, sigue como
si nada; mientras tanto, un aviso de «cita anulada» o «cita movida» la sigue cancelando o moviendo). Las
preguntas y propuestas del asistente se quedan en la bandeja, pero aprobar una propuesta mientras esté en
pausa se niega y no hace nada (FLOWS-F24). Los mensajes que ya estaban en cola no salen: caen en «Eventos
caídos» con su destinatario y se pueden volver a enviar a mano (FLOWS-F25); al encenderla no salen solos.
Una llamada a otro sistema o un turno del asistente que ya estaban en marcha terminan (el turno puede
ejecutar o dejar una propuesta nueva). Si es una receta
encendida desde otro módulo, esa pantalla la verá apagada.
Si falla: el mensaje del hub en rojo arriba. La etiqueta sigue con el estado guardado, pero el
interruptor puede quedarse movido hasta que se recarga la pantalla (leído en el código, sin ejecutar).
No hay borrar ni ejecutar en
grupo, a propósito.
Implicados: WHATSAPP_INBOX-F14, WHATSAPP_INBOX-F15, WHATSAPP_INBOX-F17, REC_WA_CITA-F01, REC_WA_MESA-F01, HUB-F86, HUB-F87
QA: qa-hub-flows R10

### FLOWS-F04 Crear una automatización desde una tarjeta de la galería
Estado: parcial — nueve de las diez tarjetas propias crean una tarea y solo salen con el módulo Tareas (congelado); lo que la tarjeta pide decidir no se marca en el editor, y tres tarjetas preguntan a quién va la tarea sin que la automatización lleve ese dato
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En la galería, toca una tarjeta. Se despliega (una a la vez) con la frase de lo que hará, «Lo que
   decides tú» (o «No hay nada que rellenar. Está lista tal cual.») y «Lo que te va a pedir permiso
   para hacer», cada permiso con su explicación.
2. Si ya hay otra automatización encendida que arranca con el mismo aviso, sale encima del botón «Ojo:
   «…» ya se dispara con lo mismo…».
3. Pulsa **Usar esta** («Se crea en pausa. No pasa nada hasta que la enciendas.»).
4. Se abre el editor de la automatización nueva, en pausa, en la pestaña **Permisos** si pide alguno.
   Sigue por FLOWS-F19, FLOWS-F20 y FLOWS-F21.
5. Si el negocio ya la tiene, la tarjeta lleva «Activa», «En pausa» o «Sin terminar» (sin ningún
   permiso concedido) y el primer botón es **Verla**, que abre la existente (en Permisos si está sin
   terminar); **Usar esta** sigue disponible y crearía una segunda.
Entra: las tarjetas propias (siete de «Cualquier negocio», dos de «Peluquería y estética», una de «Bares
y restaurantes»). Una tarjeta se esconde cuando el hub contesta que no conoce el aviso de alguno de sus
módulos; entonces, debajo de la galería, sale «Hay automatizaciones ocultas: necesitan el módulo …» y
vuelve al recargar tras instalarlo.
Sale: una automatización nueva, en pausa y sin permisos, con el nombre y los valores de la tarjeta (por
ejemplo, esperar un día, 100,00 € o seis personas). La pausa la pide la pantalla al crearla (el hub,
si no se le dice, crea encendida), y no queda ligada a su tarjeta.
Si falla: el mensaje del hub en rojo dentro de la tarjeta, que sigue abierta; no se crea nada.
Implicados: APPOINTMENTS-F09, CASH_REGISTER-F09, CUSTOMERS-F01, CUSTOMERS-F05, RESERVATIONS-F06, SALES-F01, STAFF-F01, VERIFACTU-F15, WHATSAPP_INBOX-F03, REC_PELUQUERIA-F12, HUB-F80, HUB-F108, HUB_VERIFACTU-F08
Pendiente de enlazar: tasks — nueve tarjetas crean una tarea
QA: qa-hub-flows R0, BD-10

### FLOWS-F05 Usar desde la galería una receta que trae otro módulo
Estado: parcial — «Usar esta» crea una copia en pausa que el hub no reconoce como la receta: no se puede restaurar después y la pantalla del módulo que la trae no la ve encendida
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. Bajo las tarjetas propias, una sección «Viene con …» por cada módulo instalado que trae recetas. Hoy
   solo la Bandeja de WhatsApp trae: la cita por WhatsApp y el aviso de cita confirmada (peluquería) y
   la mesa por WhatsApp (restaurante); cada una sale si están instalados los módulos que pide.
2. Toca la tarjeta: «Esta automatización viene con …», «Qué hace, paso a paso» y los permisos que pedirá
   con la frase que escribió ese módulo; un permiso con límite dice «Solo con … — no puede pedir nada
   más.».
3. Si el negocio ya tiene una automatización con ese aviso y esos permisos, la tarjeta lo marca como en
   FLOWS-F04.
4. Pulsa **Usar esta**: se crea una copia en pausa y se abre en **Permisos**.
Entra: las recetas que el hub sirve (solo las que los módulos instalados y el motor del hub pueden
ejecutar), en el idioma de la persona.
Sale: una automatización nueva, en pausa, con solo los permisos **con límite** que declara la receta ya
concedidos con su límite; el resto se concede en FLOWS-F19. Encender la receta «de verdad» (encendida,
con todos sus permisos y reconocida como tal) se hace desde la pantalla de ese módulo.
Si falla: si el hub no ha podido guardar un límite, la pantalla retira todos los permisos de esa
automatización y dice «La receta se instaló y quedó apagada, sin ningún permiso concedido…» (la copia
queda en la lista). Si el hub es anterior a esta puerta: «Este hub todavía no ofrece las
automatizaciones que vienen con tus aplicaciones…»; si la rechaza: «No se han podido cargar las
automatizaciones que vienen con tus aplicaciones…». Las tarjetas propias siguen.
Implicados: WHATSAPP_INBOX-F14, WHATSAPP_INBOX-F15, REC_WA_CITA-F01, REC_WA_MESA-F01, HUB-F80, HUB-F104
QA: qa-hub-flows R7

### FLOWS-F06 Restaurar la versión de fábrica de una receta
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En la sección «Viene con …», la tarjeta de una receta que ya se encendió desde la pantalla de su
   módulo ofrece **Restaurar la de fábrica**. Si el módulo ha publicado desde entonces una receta
   distinta, la tarjeta lleva además «Versión nueva» y, al abrirla, «Hay una versión nueva de esta
   automatización.».
2. Pulsa **Restaurar la de fábrica** (sirve también para deshacer los retoques hechos a mano).
3. Confirma con **Restaurar** («Se sustituirán tus cambios en esta automatización por la versión nueva.
   Seguirá encendida o apagada como esté ahora.») o **Dejar la mía**.
4. Sale «Hecho: esta automatización ya es la versión de fábrica.».
Entra: la receta encendida (solo las encendidas por la puerta del módulo, no las copias de FLOWS-F05).
Sale: la misma automatización (mismo historial) con el nombre, el documento y los permisos de la receta
actual;
encendida o pausada como estaba.
Si falla: «Esta automatización ya no existe aquí, así que no hay nada que restaurar. Vuelve a activarla
desde su app.» o «No se pudo restaurar la automatización. No se ha cambiado nada; inténtalo de nuevo en
un momento.».
Implicados: WHATSAPP_INBOX-F18, HUB-F107
QA: ninguno

### FLOWS-F07 Llegar a una tarjeta desde otro módulo
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. Otro módulo lleva a Automatizaciones. Hoy la Bandeja de WhatsApp lo hace con «Ajustes avanzados en
   Automatizaciones», que abre la pantalla sin más; solo enseña el enlace si la consulta de borradores
   de este módulo (`flows.drafts.list`) le contesta, que es como sabe que Automatizaciones está instalada.
2. Un enlace que nombra una tarjeta (`?template=…`, como los que publicaba la Bandeja de WhatsApp antes)
   abre esa tarjeta y la trae a la vista, aunque estuviera abierto el editor o la guía; los nombres
   antiguos de las tarjetas de WhatsApp llevan a su receta.
3. Un enlace que nombra una tarjeta que no existe enseña la galería normal.
Entra: la dirección con la que se llega.
Sale: nada guardado. El mismo enlace solo abre la tarjeta una vez por cada pulsación.
Si falla: si la tarjeta está escondida (falta su módulo), se ve la galería sin abrir nada.
Implicados: WHATSAPP_INBOX-F14, WHATSAPP_INBOX-F15
QA: ninguno

### FLOWS-F08 Hacer una copia de una automatización
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En la fila, pulsa ⧉ («Hacer una copia»).
2. Aparece «Copia de …» (o «Copia de … (2)») en la lista, en pausa, y el aviso «Copiada, y la copia está
   en pausa. No lleva ninguno de los permisos de la original: concédele lo que necesite antes de
   encenderla.».
3. Si la original llama a otro sistema con claves, el aviso añade «Sale fuera usando: … Comprueba que
   son los correctos para la copia.».
Entra: el documento de la original.
Sale: una automatización nueva con el mismo documento, en pausa (lo pide la pantalla) y sin permisos,
sin historial.
Si falla: el mensaje del hub en rojo arriba; no se crea nada.
Implicados: HUB-F80
QA: qa-hub-flows R10

### FLOWS-F09 Borrar una automatización
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. En la fila, pulsa × («Borrar»).
2. Debajo sale «¿Borrar «…»? Esto no se puede deshacer.» con **Sí, bórrala** y **Déjala**.
3. **Sí, bórrala** la quita de la lista.
Entra: la automatización elegida.
Sale: el hub la marca como borrada: deja de dispararse al momento, lo que esperaba un plazo se cancela
al momento, lo que esperaba una respuesta se cancela cuando alguien contesta la pregunta, rechaza la
propuesta o caduca, y su historial se conserva. Aprobar una propuesta del asistente de una automatización
borrada contesta «sin permiso» (sus permisos se retiraron al borrarla) y la propuesta sigue pendiente:
se cierra rechazándola. Si era una receta encendida desde otro módulo, esa pantalla deja de verla y,
si se vuelve a activar allí, se crea otra.
Si falla: el mensaje del hub en rojo arriba; la fila sigue. Desde el editor no se puede borrar.
Implicados: HUB-F88
QA: qa-hub-flows R10

### FLOWS-F10 Leer la guía
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Guía
Pasos:
1. En la galería, pulsa **¿Cómo funciona esto?**.
2. Lee los cinco apartados: qué es, la primera paso a paso (elegir de la galería, **Usar esta**,
   rellenar, Permisos, **Probar**, encender), los permisos, cómo saber si funcionó y lo que todavía no
   puede hacer (bifurcaciones, contar hacia atrás desde una fecha, el asistente no propone mensajes).
3. **Volver a las automatizaciones** regresa a la pantalla.
Entra: nada; los textos van dentro del módulo.
Sale: nada.
Si falla: no consulta al hub, así que no tiene error propio.
Implicados: ninguno
QA: qa-hub-flows R0

### FLOWS-F11 Reparar una automatización de WhatsApp montada con un fallo ya corregido
Estado: hecho
Vertical: comun
Actor: administrador
Pantalla: Automatizaciones
Pasos:
1. Bajo la fila de una automatización que arranca con cada WhatsApp que entra y no excluye los mensajes
   propios ni el historial, sale «Esta automatización también salta con tus propios mensajes» con
   **Actualizarla**.
2. Pulsa **Actualizarla** («Guardando…»): solo cambia el filtro del disparador; nombre, pasos, permisos
   e interruptor se quedan como estaban.
3. Sale ««…» ya solo salta con lo que escribe un cliente.» y el aviso desaparece.
4. Otro aviso, «La respuesta de un cliente puede contar para dos automatizaciones», sale cuando una
   comprobación de respuesta no distingue entre dos automatizaciones que hacen la misma pregunta (y el
   hub ya dice en el mensaje qué automatización la hizo); **Elegir la pregunta** abre la automatización
   para volver a elegirla (FLOWS-F14). Este no guarda nada por sí solo.
Entra: el documento guardado de cada automatización.
Sale: la automatización guardada con el filtro completo.
Si falla: «No hemos podido actualizar esta automatización: el hub la ha guardado sin el cambio…» o el
mensaje del hub; el aviso se queda.
Implicados: WHATSAPP_INBOX-F03, WHATSAPP_INBOX-F19, HUB-F86, HUB-F264
QA: ninguno
