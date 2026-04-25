# Vittra EHR SaaS Blueprint

## 1. Executive Summary

Vittra ya tiene una base valida para un SaaS de salud:

- multi-tenant por clinica
- agenda basica
- pacientes
- historia clinica
- recetas
- pagos
- auditoria

Pero todavia no expresa bien el flujo operativo real de una clinica que paga en USD por eficiencia medica y control de negocio.

Los principales gaps actuales observados en el codigo son:

- historia clinica demasiado basada en texto libre
- appointment status simple pero sin workflow de negocio completo
- permisos por rol, no por capacidad fina ni por dato sensible
- dashboards y tipos frontend con residuos de otro dominio
- prescripcion y ordenes sin modelo lo suficientemente robusto para escalar
- cobro desacoplado del encuentro clinico

La estrategia recomendada es transformar Vittra en un producto centrado en el flujo:

Turno -> Consulta -> Evolucion -> Receta/Orden -> Cobro

El producto debe venderse como:

"Sistema clinico operativo para clinicas ambulatorias modernas que necesitan velocidad medica, control financiero y trazabilidad real".

## 2. Product Principles

### 2.1 Lo que compra la clinica

No compra "software". Compra:

- menos ausentismo
- menos tiempo administrativo
- menos riesgo clinico
- mas consultas cerradas por dia
- mas cobrabilidad
- mejor control medico-legal

### 2.2 Principios de producto

- medico-first: menos clics, mas teclado, defaults inteligentes
- structured by default: texto libre solo donde agrega valor
- tenant-safe: aislamiento estricto por clinica
- workflow-first: cada modulo empuja al siguiente
- billable care: toda atencion termina en estado clinico y financiero claro
- specialty-ready: base comun + templates por especialidad

## 3. Target Architecture

### 3.1 Stack

- Backend: FastAPI
- Database: PostgreSQL
- Cache/Jobs: Redis + worker async
- Frontend: React + TypeScript
- File storage: S3 compatible
- PDF generation: server-side HTML to PDF
- Audit: append-only audit log + field-level access log for sensitive data

### 3.2 Modular backend domains

Separar por bounded contexts:

1. Identity and Access
2. Tenant and Subscription
3. Patients
4. Scheduling
5. Encounter / Clinical Documentation
6. Prescriptions
7. Orders and Results
8. Billing and Collections
9. Notifications
10. Files and Documents
11. Audit and Compliance
12. AI Assistants

### 3.3 Suggested service layout

```text
backend/app/
  modules/
    auth/
    tenants/
    patients/
    scheduling/
    encounters/
    prescriptions/
    orders/
    billing/
    files/
    notifications/
    audit/
    ai/
```

### 3.4 Multi-tenant model

Nivel recomendado de tenancy:

- `tenant`: grupo de negocio / organizacion cliente
- `clinic_site`: sucursal o sede
- `user_membership`: usuario dentro del tenant con rol y alcance
- `patient`: paciente del tenant
- `provider_schedule`: agenda por profesional y/o sede

Todos los recursos clinicos y financieros deben tener:

- `tenant_id`
- `clinic_site_id` cuando corresponda
- `created_by`
- `updated_by`
- timestamps
- soft delete o archival state segun recurso

### 3.5 Event-driven internal workflow

No hace falta microservicios en V1, pero si eventos internos:

- `appointment.booked`
- `appointment.confirmed`
- `appointment.checked_in`
- `encounter.started`
- `encounter.signed`
- `prescription.issued`
- `order.created`
- `invoice.generated`
- `payment.captured`
- `patient.no_show_recorded`

Esto permite reminders, waitlist, audit, analytics e IA sin acoplar todo.

## 4. End-to-End Clinical Flow

## 4.1 Core entities

- Appointment
- Encounter
- Clinical Note / Evolution
- Prescription
- Study Order
- Invoice / Charge
- Payment

## 4.2 Appointment states

Estados recomendados del turno:

- `draft`
- `reserved`
- `confirmed`
- `checked_in`
- `in_progress`
- `completed`
- `cancelled`
- `no_show`

Estados derivados utiles:

- `rescheduled`
- `waitlist`
- `overbooked`

### 4.3 State transition rules

```text
draft -> reserved
reserved -> confirmed | cancelled
confirmed -> checked_in | no_show | cancelled
checked_in -> in_progress | cancelled
in_progress -> completed
completed -> closed_financially (derived, not primary status)
```

### 4.4 Workflow orchestration

1. Recepcion o paciente reserva turno
2. Sistema valida agenda, bloqueos y reglas de sobreturno
3. Se dispara confirmacion y reminders
4. Paciente hace check-in digital o presencial
5. Profesional inicia consulta desde la lista del dia
6. Se abre encounter ligado al turno
7. Medico completa evolucion estructurada
8. Desde la misma pantalla emite receta y/o orden
9. El sistema calcula items facturables
10. Recepcion o caja cobra y emite comprobante
11. Turno queda cerrado clinica y financieramente

### 4.5 UX para medicos

La pantalla del medico no debe estar centrada en menus, sino en una unica consola:

- columna izquierda: cola del dia
- centro: encounter actual
- lateral derecho: Patient 360
- footer sticky: acciones rapidas

Acciones rapidas:

- guardar borrador
- firmar evolucion
- emitir receta
- pedir estudio
- cerrar consulta

Reglas UX:

- abrir el turno correcto en 1 click
- autoguardado cada 10-15 segundos
- shortcuts de teclado
- smart defaults por especialidad
- campos plegables, no formularios gigantes
- plantillas personales del medico

## 5. Data Model Redesign

## 5.1 Problema actual

En el modelo actual, `Patient` y `MedicalRecord` concentran demasiado texto libre:

- alergias como string
- medicacion cronica como string
- CIE-10 como string
- attachments como string
- examen fisico como string

Eso limita:

- alertas automaticas
- busquedas
- comparativas
- BI
- interoperabilidad futura

## 5.2 Modelo objetivo

### Core patient tables

```text
tenants
clinic_sites
users
roles
permissions
user_memberships

patients
patient_identifiers
patient_contacts
patient_coverages
patient_alerts
patient_allergies
patient_medications_chronic
patient_problems
patient_family_history
patient_documents
```

### Scheduling tables

```text
providers
provider_availability_rules
schedule_blocks
appointments
appointment_status_history
waitlist_entries
checkins
```

### Clinical tables

```text
encounters
encounter_templates
clinical_notes
clinical_note_sections
vital_sign_sets
physical_exam_findings
diagnoses
encounter_diagnoses
care_plans
attachments
```

### Orders and prescriptions

```text
prescriptions
prescription_items
prescription_signatures
medication_catalog
drug_interactions_cache

study_orders
study_order_items
study_results
study_result_observations
study_attachments
```

### Billing tables

```text
price_lists
billable_items
encounter_charges
invoices
invoice_items
payments
payment_allocations
payer_rules
```

## 5.3 Suggested schema details

### `patients`

Campos:

- `id`
- `tenant_id`
- `clinic_site_id`
- `mrn`
- `first_name`
- `last_name`
- `birth_date`
- `sex_at_birth`
- `gender_identity`
- `document_type`
- `document_number`
- `phone`
- `email`
- `address_jsonb`
- `insurance_status`
- `default_coverage_id`
- `is_active`

### `patient_alerts`

Campos:

- `patient_id`
- `alert_type`: allergy | fall_risk | anticoagulated | pregnancy | infectious_risk | admin
- `severity`: low | medium | high | critical
- `title`
- `description`
- `is_active`
- `visible_on_checkin`
- `visible_on_prescription`
- `visible_on_encounter`

### `patient_allergies`

Campos:

- `patient_id`
- `substance_type`: drug | food | environment | other
- `substance_code`
- `substance_label`
- `reaction`
- `severity`
- `status`: active | inactive | entered_in_error
- `source`

### `patient_medications_chronic`

Campos:

- `patient_id`
- `medication_code`
- `medication_label`
- `dose`
- `frequency`
- `route`
- `started_at`
- `status`
- `prescribed_by`

### `encounters`

Campos:

- `id`
- `tenant_id`
- `appointment_id`
- `patient_id`
- `provider_id`
- `clinic_site_id`
- `specialty_code`
- `encounter_type`
- `status`: draft | in_progress | signed | amended
- `started_at`
- `ended_at`
- `signed_at`
- `signed_by`

### `clinical_notes`

Una nota por encounter, pero seccionada.

Campos:

- `encounter_id`
- `subjective_jsonb`
- `objective_jsonb`
- `assessment_jsonb`
- `plan_jsonb`
- `free_text_summary`

### `vital_sign_sets`

Campos:

- `encounter_id`
- `temperature_c`
- `heart_rate`
- `resp_rate`
- `systolic_bp`
- `diastolic_bp`
- `spo2`
- `weight_kg`
- `height_cm`
- `bmi`
- `pain_scale`

### `diagnoses`

Catalogo clinico:

- `code_system`: CIE10
- `code`
- `label`
- `is_billable`

### `encounter_diagnoses`

Campos:

- `encounter_id`
- `diagnosis_id`
- `rank`
- `diagnosis_type`: primary | secondary | differential
- `clinical_status`
- `notes`

### `physical_exam_findings`

Modelo flexible:

- `encounter_id`
- `system_code`: general | cv | resp | neuro | skin | abdomen
- `finding_code`
- `finding_label`
- `value_type`: boolean | number | coded | text
- `value_boolean`
- `value_numeric`
- `value_text`
- `unit`
- `is_abnormal`

### `prescriptions`

Cabecera:

- `encounter_id`
- `patient_id`
- `provider_id`
- `status`: draft | signed | cancelled | expired
- `renewal_allowed`
- `renewal_remaining`
- `digital_signature_id`
- `pdf_url`

### `prescription_items`

- `prescription_id`
- `medication_code`
- `medication_label`
- `presentation`
- `dose`
- `route`
- `frequency`
- `duration_value`
- `duration_unit`
- `quantity`
- `indication`
- `warnings_jsonb`

### `study_orders`

- `encounter_id`
- `patient_id`
- `provider_id`
- `status`: draft | signed | sent | scheduled | in_progress | resulted | reviewed | cancelled
- `priority`
- `clinical_question`
- `instructions`
- `pdf_url`

### `study_order_items`

- `study_order_id`
- `study_code`
- `study_label`
- `modality`: lab | imaging | procedure
- `body_site`
- `laterality`
- `fasting_required`

### `study_results`

- `study_order_item_id`
- `result_status`
- `result_date`
- `result_summary`
- `structured_result_jsonb`
- `abnormal_flag`
- `reviewed_at`
- `reviewed_by`

### `invoices`

- `patient_id`
- `appointment_id`
- `encounter_id`
- `coverage_id`
- `status`: draft | issued | partially_paid | paid | void
- `total_amount`
- `coverage_amount`
- `patient_amount`
- `currency`

## 5.4 Specialty-specific templates

La base de encounter debe ser comun, pero los templates cambian por especialidad.

### Clinica medica

- motivo de consulta
- HPI
- antecedentes personales
- antecedentes familiares
- medicacion actual
- alergias
- signos vitales
- examen fisico por sistemas
- impresion diagnostica
- plan

### Pediatria

- acompaniante
- motivo de consulta
- antecedentes perinatales
- vacunas
- curvas de crecimiento
- alimentacion
- desarrollo madurativo
- examen fisico pediatrico
- alarmas

### Ginecologia

- FUM
- G/P/C/A
- anticoncepcion
- antecedentes gineco-obstetricos
- PAP / HPV / mamografia
- examen ginecologico

### Dermatologia

- motivo
- tiempo de evolucion
- localizacion anatomica
- morfologia lesion
- sintomas asociados
- fotos clinicas
- tratamiento previo

Implementacion recomendada:

- `encounter_templates`
- `template_fields`
- `specialty_field_rules`

Cada campo configurable con:

- tipo
- required
- order
- shortcut
- default
- visibility by role

## 6. Advanced Scheduling

## 6.1 Modelo funcional

La agenda no debe ser solo una tabla de citas. Debe resolver:

- disponibilidad
- capacidad
- conflicto de profesional
- conflicto de consultorio
- confirmacion
- reubicacion
- lista de espera
- no-show
- check-in

## 6.2 Scheduling entities

- `provider_availability_rules`
- `provider_time_off`
- `schedule_blocks`
- `rooms`
- `appointments`
- `waitlist_entries`
- `reminder_logs`
- `checkins`

## 6.3 Features

### Agenda por profesional y consultorio

Vista dual:

- agenda del profesional
- agenda del consultorio

Reglas:

- una cita consume slot de profesional
- opcionalmente consume consultorio/equipo
- procedimientos pueden consumir mas de un recurso

### Bloqueos

Tipos:

- vacaciones
- congreso
- feriado
- mantenimiento sala
- bloqueo administrativo
- urgencia

### Sobreturnos inteligentes

Reglas:

- solo si tipo de cita permite overbook
- solo si score historico de no-show del bloque es alto
- solo si medico habilito sobrecupo
- marcar visualmente el riesgo operacional

### Lista de espera automatica

Capturar:

- franja horaria preferida
- profesional
- especialidad
- sede
- prioridad

Al liberarse un turno:

1. rankear candidatos
2. notificar por WhatsApp/Email
3. reservar temporalmente por X minutos
4. confirmar o pasar al siguiente

### No-show management

Guardar:

- contador historico
- motivo
- fee policy
- score de confiabilidad

Uso:

- limitar reservas futuras
- exigir senia
- sugerir reminders reforzados

### Recordatorios

Canales:

- WhatsApp
- Email
- SMS opcional

Cadencia recomendada:

- al reservar
- 48h antes
- 24h antes
- 2h antes

### Check-in

Opciones:

- recepcion
- QR
- link remoto

Estados:

- not_arrived
- arrived
- forms_pending
- ready_for_provider

## 7. Prescripcion Medica Robusta

## 7.1 Objetivo

La receta debe ser una consecuencia del encounter, no un modulo aislado.

## 7.2 Requisitos

- PDF profesional e imprimible
- firma digital
- trazabilidad de renovaciones
- validacion de alergias
- validacion de interacciones
- plan de tratamiento estructurado

## 7.3 Flujo

1. Medico agrega farmaco desde catalogo
2. Sistema autocompleta presentacion y dosis frecuentes
3. Valida alergias y medicacion cronica
4. Sugiere frecuencia y duracion por template
5. Genera PDF
6. Firma digitalmente
7. Guarda copia versionada

## 7.4 Alertas

Niveles:

- informativa
- moderada
- severa
- bloqueo

Alertas minimas en V1:

- droga coincide con alergia declarada
- posible duplicidad terapeutica
- interaccion con medicacion cronica registrada
- embarazo / lactancia si aplica

## 7.5 Renewal model

No reusar la misma receta como string mutable.

Usar:

- receta original
- renovaciones vinculadas
- contador restante
- motivo de renovacion
- fecha de proxima revision

## 8. Orders and Studies

## 8.1 Flujo

1. Medico crea orden desde encounter
2. Orden puede incluir multiples items
3. Se genera PDF o canal digital
4. Resultado se carga manual o por integracion
5. Resultado queda comparado con historicos
6. Medico marca revisado

## 8.2 Tipos de orden

- laboratorio
- imagenes
- cardiologia
- procedimientos
- derivaciones

## 8.3 Result visualization

Para laboratorios:

- tabla historica por analito
- sparkline de tendencia
- bandera de fuera de rango

Para imagenes:

- informe textual
- adjuntos DICOM/PDF/JPG
- comparacion con estudio previo

## 9. Patient 360

## 9.1 Objetivo

Una sola pantalla para decidir rapido.

## 9.2 Layout recomendado

### Header

- nombre
- edad
- documento
- cobertura
- medico de cabecera
- alertas criticas

### Left rail

- proximos turnos
- estado de cuenta
- pendientes administrativos

### Main content

- motivo actual
- ultima evolucion
- diagnosticos activos
- recetas activas
- estudios pendientes
- ultimos resultados

### Right rail

- alergias
- medicacion cronica
- antecedentes
- documentos clave

## 9.3 Widgets obligatorios

- ultimos diagnosticos CIE-10
- proximos turnos
- deuda / cobertura
- alertas clinicas
- documentos relevantes
- timeline longitudinal

## 10. RBAC Advanced

## 10.1 Problema actual

Hoy el sistema asigna permisos por rol fijo. Para salud real, eso no alcanza.

## 10.2 Modelo recomendado

Separar:

- rol base
- permiso
- alcance
- contexto

### Acciones

- `read`
- `create`
- `update`
- `delete`
- `sign`
- `export`
- `view_sensitive`
- `view_financial`

### Recursos

- patient
- appointment
- encounter
- prescription
- study_order
- result
- invoice
- payment
- audit_log

### Scope

- own_patients
- own_appointments
- clinic_site
- tenant
- assigned_provider

## 10.3 Example roles

### Medico

- leer y editar pacientes asignados
- crear y firmar encounters
- emitir y firmar recetas
- crear ordenes
- ver datos sensibles clinicos
- ver finanzas resumidas, no necesariamente cobranza completa

### Recepcion

- leer ficha demografica
- crear y mover turnos
- check-in
- cobrar
- no ver notas sensibles ni evoluciones completas

### Admin

- acceso operativo y financiero total
- configuracion de tenant
- auditoria

### Paciente

- ver sus turnos
- descargar recetas y ordenes
- ver resultados liberados
- pagar saldo

## 10.4 Sensitive data controls

Marcar como sensibles:

- salud mental
- VIH/ITS
- violencia
- adicciones
- notas privadas del profesional

Para estos recursos:

- permission explicito
- audit log reforzado
- reason-for-access opcional en enterprise tier

## 11. AI Phase 2

La IA no debe ser core en V1. Debe acelerar documentacion y lectura.

## 11.1 Use cases correctos

- dictado medico -> campos estructurados
- resumen automatico de evolucion
- borrador de nota clinica
- resumen longitudinal del paciente

## 11.2 Guardrails

- siempre editable por humano
- nunca firmar automatico
- mostrar fuente / secciones usadas
- no inventar CIE-10 ni medicacion sin confirmacion

## 12. Frontend UX Direction

## 12.1 Visual system

Direccion sugerida:

- limpio y premium tipo Stripe
- rapidez operativa tipo Linear / Notion
- alta densidad de informacion sin verse hospital legacy

## 12.2 Core screens

1. Agenda diaria
2. Consola de consulta
3. Patient 360
4. Recepcion / check-in
5. Caja / cobranzas
6. Configuracion operativa

## 12.3 UX patterns

- command bar global
- drawer lateral para tareas cortas
- tabs persistentes por paciente
- sticky action rail en encounter
- badges de riesgo y alertas
- timeline con filtros

## 12.4 What to avoid

- formularios gigantes de una sola columna
- menus profundos
- demasiados modales
- texto libre como default
- cerrar el turno sin cerrar lo financiero

## 13. API Design Recommendations

### Scheduling

```text
POST   /appointments
POST   /appointments/{id}/confirm
POST   /appointments/{id}/check-in
POST   /appointments/{id}/start
POST   /appointments/{id}/complete
POST   /appointments/{id}/cancel
POST   /appointments/{id}/no-show

GET    /agenda/day
GET    /agenda/week
POST   /waitlist
POST   /schedule-blocks
```

### Encounters

```text
POST   /encounters/from-appointment/{appointment_id}
GET    /encounters/{id}
PATCH  /encounters/{id}
POST   /encounters/{id}/sign
POST   /encounters/{id}/amend
```

### Prescriptions

```text
POST   /prescriptions
POST   /prescriptions/{id}/sign
POST   /prescriptions/{id}/renew
GET    /prescriptions/{id}/pdf
```

### Orders

```text
POST   /study-orders
POST   /study-orders/{id}/sign
POST   /study-orders/{id}/results
POST   /study-orders/{id}/review
GET    /study-orders/{id}/timeline
```

### Billing

```text
POST   /encounters/{id}/generate-charge
POST   /invoices
POST   /payments
POST   /payments/{id}/capture
GET    /patients/{id}/account
```

## 14. Development Roadmap

## 14.1 MVP

Objetivo: vender a consultorios y clinicas ambulatorias pequenas/medianas.

Incluye:

- multi-tenant real
- agenda diaria/semanal
- estados completos del turno
- patient 360 basico
- encounter estructurado para 2 especialidades
- CIE-10 searchable
- recetas PDF con firma simple
- ordenes de estudio
- caja y pagos basicos
- reminders WhatsApp/Email
- audit log
- RBAC basico con permisos finos minimos

KPI MVP:

- tiempo a iniciar consulta < 10 segundos
- tiempo a cerrar consulta simple < 2 minutos
- no-show down 15-20%
- cierre de cobro en mismo dia > 80%

## 14.2 PRO

Objetivo: clinicas con mas volumen y complejidad operativa.

Incluye:

- waitlist automatica
- sobreturno inteligente
- mas especialidades con templates
- firma digital fuerte
- comparativas de resultados
- reglas por cobertura
- portal paciente
- dashboards operativos y financieros
- AI assistant clinico

## 14.3 ENTERPRISE

- multi-site avanzado
- SSO / SCIM
- reason-for-access
- integraciones LIS/RIS/PACS
- integracion clearing / claims
- configuracion de compliance regional
- SLA y entornos dedicados

## 15. Monetization Strategy

## 15.1 Pricing model recomendado

No vender solo por usuario. Mezclar:

- base por sede
- modulo por profesional activo
- add-ons de alto valor

### Suggested pricing

- Starter: USD 299-499 / sede / mes
- Growth: USD 799-1499 / sede / mes
- Pro: USD 1999+ / mes
- Enterprise: custom

### Add-ons

- WhatsApp reminders
- firma digital avanzada
- portal paciente
- AI clinical assistant
- analytics financiero
- integraciones externas

## 15.2 What drives willingness to pay

- menos no-show
- mejor cobranza
- menor tiempo medico por consulta
- respaldo medico-legal
- reportes para duenios/directores

## 16. Competitive Differentiators

Para competir, Vittra no debe parecer otro "agenda + ficha paciente".

Diferenciales recomendados:

1. Clinical workflow operating system
2. Patient 360 realmente util, no solo listado de datos
3. Encounter ultra rapido con estructura por especialidad
4. Agenda inteligente con waitlist y no-show scoring
5. Cobro conectado al acto medico
6. Alertas clinicas visibles en todo el journey
7. Base SaaS premium, simple de usar y lista para escalar

## 17. Recommended Build Sequence

Orden recomendado para el equipo:

1. limpiar dominio actual y eliminar residuos fitness en frontend/docs
2. rediseñar modelos de patient, encounter, diagnosis, prescription, order, billing
3. consolidar agenda con workflow states correctos
4. construir Patient 360
5. construir encounter workspace medico
6. conectar receta y orden desde encounter
7. conectar encounter con invoice/payment
8. endurecer RBAC y audit
9. agregar automation de reminders/waitlist
10. agregar IA como acelerador

## 18. Immediate Technical Priorities For This Codebase

Basado en el estado actual del repo, haria esto primero:

### Backend

- reemplazar strings clinicos por tablas normalizadas o JSONB controlado
- separar `MedicalRecord` en `Encounter` + secciones estructuradas
- crear `appointment_status_history`
- crear `invoice` y `invoice_items`
- mover permisos de `PERMISSIONS_BY_ROLE` a modelo persistido o matriz mas granular
- agregar catalogos: CIE-10, medicamentos, estudios

### Frontend

- eliminar tipos heredados de gym/studio en `frontend/src/types/domain.ts`
- reemplazar `MedicalRecordsPage` placeholder por workspace real
- unificar dashboard con metricas clinicas reales
- crear agenda con vista por profesional / consultorio / dia
- crear patient 360 de una pantalla

### Product

- elegir 2 especialidades iniciales
- definir pricing de salida
- definir narrativa comercial

## 19. Decision Summary

La mejor version vendible de Vittra no es "un EMR completo desde dia 1". Es:

- una agenda clinica inteligente
- un workspace medico muy rapido
- una historia clinica estructurada por especialidad
- una capa de prescripcion/ordenes segura
- una capa de cobro conectada al acto asistencial

Si se ejecuta asi, Vittra puede entrar al mercado como un SaaS premium para clinicas ambulatorias, con una ruta clara desde MVP a PRO sin sobreconstruir la V1.
