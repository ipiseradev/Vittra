# Vittra Commercial Product Redesign

## 1. Product direction

Vittra debe venderse como un sistema operativo clinico y financiero para clinicas ambulatorias, no como una suma de modulos sueltos.

Narrativa comercial:

- menos tiempo administrativo por consulta
- menos no-show
- mas consultas cerradas con receta y cobro el mismo dia
- mejor visibilidad para direccion, recepcion y profesionales
- trazabilidad medico-legal con UX simple

Principio rector:

`Turno -> Consulta -> Evolucion -> Receta / Orden -> Facturacion -> Pago`

## 2. Conceptual redesign by module

### Dashboard

Debe mostrar:

- pacientes esperando ahora
- turnos con retraso
- consultas en curso
- alertas clinicas visibles hoy
- acciones rapidas: crear turno, nuevo paciente, iniciar consulta, abrir IA

Debe dejar de mostrar:

- metricas lindas pero vacias
- resumenes sin siguiente accion

### Agenda medica

La agenda debe ser un centro operativo del dia:

- vista por profesional
- vista por consultorio
- estados operativos: confirmado, en espera, en consulta, ausente
- acciones visibles por tarjeta: check-in rapido, iniciar consulta, reprogramar, cancelar
- derivacion directa a historia clinica

### Historia clinica

La pantalla principal debe ser Patient 360:

- header con nombre, documento, cobertura, profesional, alertas criticas
- rail izquierdo con cola del dia y pendientes administrativos
- centro con encounter actual y evolucion estructurada
- rail derecho con alergias, medicacion cronica, diagnosticos CIE-10, problemas activos
- timeline clinico longitudinal

### Prescripciones

La receta debe salir desde la consulta:

- composer de medicacion con frecuencia, duracion e indicacion
- alertas de alergia e interaccion
- renovaciones trazables
- PDF y firma digital
- plan de tratamiento asociado
- CTA a facturacion del episodio

### Facturacion y pagos

Debe responder preguntas de negocio en segundos:

- ingresos del dia y del mes
- pacientes con deuda
- pagos por metodo
- no-show rate
- ingresos por profesional
- caja del dia vinculada a la atencion clinica

## 3. UX/UI improvements to apply globally

- Cada empty state debe terminar en una accion concreta.
- Cada pagina debe tener CTA principal visible arriba del fold.
- El microcopy debe empujar accion.
- Los badges deben reflejar riesgo, estado y prioridad.
- La jerarquia visual debe separar claramente:
  - operativo ahora
  - contexto clinico
  - siguiente accion
- Los modulos clinicos deben priorizar lectura rapida antes que densidad de formulario.

Ejemplos de microcopy:

- "No hay citas" -> "No tenes turnos hoy. Crea el primero para activar la agenda."
- "No hay recetas" -> "Todavia no emitiste recetas desde esta consulta. Crear receta."
- "No hay pacientes" -> "Carga un paciente para iniciar agenda, consulta y facturacion."

## 4. New components required

- `ClinicalAssistantDock`
- `Patient360Header`
- `ClinicalAlertRail`
- `EncounterActionRail`
- `AppointmentQueueCard`
- `WorkflowStageCard`
- `PrescriptionComposer`
- `BillingClosureCard`
- `RevenueByDoctorList`
- `PaymentMethodBreakdown`
- `RenewalQueue`
- `ClinicalTimeline`

## 5. Connected system flow

### Step 1: Turno

- Recepcion crea o confirma turno
- IA puede ejecutar "agendar turno"
- El turno entra a la cola operativa

### Step 2: Consulta

- Check-in rapido
- Profesional inicia consulta desde agenda o dashboard
- Se abre encounter ligado al turno

### Step 3: Evolucion

- Se completa nota estructurada
- IA resume contexto, sugiere proximos pasos y arma borradores editables

### Step 4: Receta / orden

- Desde el encounter se emite receta u orden
- Se validan alergias e interacciones
- Se genera PDF y firma

### Step 5: Facturacion

- El sistema calcula el cargo del episodio
- Recepcion visualiza saldo, cobertura y medio sugerido

### Step 6: Pago

- Se registra el pago
- El flujo queda cerrado clinica y financieramente

## 6. AI as central feature

La IA no debe vivir en una pantalla secundaria. Debe estar siempre disponible y disparar acciones reales.

### IA visible siempre

- boton flotante global
- panel lateral
- comandos de texto con shortcuts de negocio

### Use cases

- "Agendar turno para Juan manana"
- "Crear receta del paciente actual"
- "Mostrar pacientes con diabetes"
- "Dame resumen clinico del paciente"
- "Cobrar la consulta actual"

### Real integrations

- abre el drawer correcto
- navega con contexto a la pantalla indicada
- preselecciona paciente / episodio
- sugiere siguiente accion por etapa del flujo

## 7. Real interaction examples

### Recepcion

1. Abre dashboard
2. Ve 4 pacientes esperando y 2 turnos con retraso
3. Hace check-in desde agenda
4. Inicia consulta con un click

### Medico

1. Entra a Patient 360
2. Lee alergias, medicacion cronica y diagnosticos en segundos
3. Firma evolucion
4. Emite receta
5. Deja indicado control y laboratorio

### Caja / administracion

1. Entra a facturacion
2. Ve deuda, mix de pagos y no-show rate
3. Cobra episodio pendiente
4. Cierra el flujo del paciente

## 8. Commercial positioning

Para vender entre USD 500 y USD 2000, Vittra tiene que prometer y demostrar:

- velocidad operativa
- seguridad clinica
- cierre de flujo completo
- control financiero visible
- IA que ahorra tiempo real

Mensaje sugerido:

"Vittra conecta agenda, consulta, receta y cobro en una sola experiencia. La clinica gana velocidad operativa, el medico trabaja con mejor contexto y la direccion ve el negocio en tiempo real."
