from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Literal

import httpx
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Appointment, AppointmentStatus, MedicalRecord, Patient, User

LLMProvider = Literal["auto", "openai", "anthropic", "demo"]

DEFAULT_PATIENT_SUMMARY_QUESTION = (
    "Resume la informacion clinica del paciente usando solo el contexto entregado."
)

DEFAULT_LONGITUDINAL_SUMMARY_QUESTION = (
    "Genera un resumen longitudinal del paciente priorizando problemas, diagnosticos, "
    "tratamientos, estudios pendientes y proximas acciones."
)

DEFAULT_CLINICAL_NOTE_DRAFT_PROMPT = (
    "Genera un borrador de evolucion clinica usando solo el contexto estructurado y el "
    "dictado entregado. No inventes datos faltantes."
)

MEDICAL_ASSISTANT_SYSTEM_PROMPT = """
Eres un asistente medico para un sistema clinico.
Usa unicamente los datos estructurados que se te entregan a continuacion para responder al usuario.
No inventes datos, no completes campos faltantes y no agregues diagnosticos nuevos.
Responde siempre en espanol.
Formatea siempre la informacion en una lista con vietas.
Usa exactamente estos titulos en negrita y en este orden:
**Datos Personales**
**Historial Reciente**
**Proximas Citas**
Si alguna seccion no tiene informacion, indicalo explicitamente con una vieta breve.
Mantene el contenido claro, concreto y facil de leer por personal clinico.
""".strip()


def _to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.replace(microsecond=0).isoformat()


def _compact_dict(data: dict[str, Any]) -> dict[str, Any]:
    compacted: dict[str, Any] = {}
    for key, value in data.items():
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if not value:
                continue
        compacted[key] = value
    return compacted


def _render_demo_summary(patient_context: dict[str, Any], user_question: str) -> str:
    patient = patient_context.get("patient", {})
    recent_records = patient_context.get("recent_medical_records", [])
    upcoming_appointments = patient_context.get("upcoming_appointments", [])

    lines = [
        "**Datos Personales**",
        f"- Nombre completo: {patient.get('full_name', 'No disponible')}",
        f"- Fecha de nacimiento: {patient.get('date_of_birth', 'No registrada')}",
        f"- Genero: {patient.get('gender', 'No registrado')}",
        f"- Estado: {'Activo' if patient.get('is_active') else 'Inactivo'}",
        "",
        "**Historial Reciente**",
    ]

    if recent_records:
        for record in recent_records:
            lines.append(
                f"- Registro {record.get('record_id')}: {record.get('diagnosis', 'Sin diagnostico cargado')}."
            )
            lines.append(
                f"  Fecha: {record.get('created_at', 'Sin fecha')} | Motivo: {record.get('chief_complaint', 'No registrado')}"
            )
    else:
        lines.append("- No hay registros medicos recientes para este paciente.")

    lines.extend(
        [
            "",
            "**Proximas Citas**",
        ]
    )

    if upcoming_appointments:
        for appointment in upcoming_appointments:
            lines.append(
                f"- {appointment.get('scheduled_at', 'Sin fecha')} | {appointment.get('appointment_type', 'Consulta')} | Profesional: {appointment.get('doctor_name', 'Sin asignar')}"
            )
    else:
        lines.append("- No hay proximas citas agendadas.")

    lines.extend(
        [
            "",
            f"- Consulta actual: {user_question.strip()}",
            "- Nota: respuesta generada en modo demo local para mantener la experiencia disponible.",
        ]
    )

    return "\n".join(lines).strip()


def _generate_with_provider(provider: LLMProvider, system_prompt: str, user_message: str) -> tuple[str, str]:
    if provider == "openai":
        return _call_openai(system_prompt=system_prompt, user_message=user_message), settings.OPENAI_MODEL
    if provider == "anthropic":
        return _call_anthropic(system_prompt=system_prompt, user_message=user_message), settings.ANTHROPIC_MODEL
    raise ValueError(f"Unsupported provider for live generation: {provider}")


def build_patient_llm_context(db: Session, clinic_id: int, patient_id: int) -> dict[str, Any]:
    patient = db.execute(
        select(Patient).where(
            and_(
                Patient.clinic_id == clinic_id,
                Patient.id == patient_id,
            )
        )
    ).scalar_one_or_none()

    if patient is None:
        raise LookupError(f"Patient {patient_id} not found in clinic {clinic_id}")

    recent_records = db.execute(
        select(MedicalRecord)
        .where(
            and_(
                MedicalRecord.clinic_id == clinic_id,
                MedicalRecord.patient_id == patient_id,
            )
        )
        .order_by(MedicalRecord.created_at.desc())
        .limit(3)
    ).scalars().all()

    upcoming_appointments = db.execute(
        select(Appointment, User.full_name.label("doctor_name"))
        .join(
            User,
            and_(
                User.id == Appointment.doctor_id,
                User.clinic_id == clinic_id,
            ),
            isouter=True,
        )
        .where(
            and_(
                Appointment.clinic_id == clinic_id,
                Appointment.patient_id == patient_id,
                Appointment.scheduled_at >= datetime.utcnow(),
                Appointment.status.in_(
                    (
                        AppointmentStatus.SCHEDULED,
                        AppointmentStatus.RESCHEDULED,
                    )
                ),
            )
        )
        .order_by(Appointment.scheduled_at.asc())
    ).all()

    return {
        "patient_id": patient.id,
        "full_name": patient.full_name,
        "patient": _compact_dict(
            {
                "full_name": patient.full_name,
                "date_of_birth": _to_iso(patient.date_of_birth),
                "gender": patient.gender.value if patient.gender else None,
                "is_active": patient.is_active,
            }
        ),
        "recent_medical_records": [
            _compact_dict(
                {
                    "record_id": record.id,
                    "created_at": _to_iso(record.created_at),
                    "chief_complaint": record.chief_complaint,
                    "diagnosis": record.diagnosis,
                    "treatment_plan": record.treatment_plan,
                    "allergies": record.allergies,
                    "chronic_conditions": record.chronic_conditions,
                    "notes": record.notes,
                }
            )
            for record in recent_records
        ],
        "upcoming_appointments": [
            _compact_dict(
                {
                    "appointment_id": appointment.id,
                    "scheduled_at": _to_iso(appointment.scheduled_at),
                    "appointment_type": appointment.appointment_type.value,
                    "status": appointment.status.value,
                    "duration_minutes": appointment.duration_minutes,
                    "room": appointment.room,
                    "doctor_name": doctor_name,
                    "notes": appointment.notes,
                }
            )
            for appointment, doctor_name in upcoming_appointments
        ],
        "generated_at": _to_iso(datetime.utcnow()),
    }


def build_patient_summary_request(
    db: Session,
    clinic_id: int,
    patient_id: int,
    user_question: str = DEFAULT_PATIENT_SUMMARY_QUESTION,
) -> dict[str, Any]:
    patient_context = build_patient_llm_context(db, clinic_id, patient_id)
    user_message = (
        "Consulta del usuario:\n"
        f"{user_question.strip()}\n\n"
        "Contexto clinico en JSON:\n"
        f"{json.dumps(patient_context, ensure_ascii=False, indent=2)}"
    )

    return {
        "system_prompt": MEDICAL_ASSISTANT_SYSTEM_PROMPT,
        "user_message": user_message,
        "patient_context": patient_context,
    }


def _call_openai(system_prompt: str, user_message: str) -> str:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.OPENAI_MODEL,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        },
        timeout=settings.LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def _call_anthropic(system_prompt: str, user_message: str) -> str:
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": settings.ANTHROPIC_MODEL,
            "max_tokens": 700,
            "system": system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": user_message,
                }
            ],
        },
        timeout=settings.LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    text_blocks = [
        block["text"].strip()
        for block in data.get("content", [])
        if block.get("type") == "text" and block.get("text")
    ]
    return "\n".join(text_blocks).strip()


def generate_patient_summary(
    db: Session,
    clinic_id: int,
    patient_id: int,
    provider: LLMProvider = "auto",
    user_question: str = DEFAULT_PATIENT_SUMMARY_QUESTION,
    fallback_to_demo: bool = True,
) -> dict[str, Any]:
    request_payload = build_patient_summary_request(
        db=db,
        clinic_id=clinic_id,
        patient_id=patient_id,
        user_question=user_question,
    )

    fallback_used = False
    error_message: str | None = None
    provider_requested = provider

    try:
        if provider == "demo":
            summary = _render_demo_summary(
                patient_context=request_payload["patient_context"],
                user_question=user_question,
            )
            provider_used = "demo"
            model = "local-clinical-template"
        else:
            provider_attempts: list[LLMProvider]
            if provider == "auto":
                provider_attempts = []
                if settings.OPENAI_API_KEY:
                    provider_attempts.append("openai")
                if settings.ANTHROPIC_API_KEY:
                    provider_attempts.append("anthropic")
                if not provider_attempts:
                    raise RuntimeError("No live LLM provider is configured")
            else:
                provider_attempts = [provider]

            last_error: Exception | None = None
            summary = ""
            provider_used = provider
            model = ""

            for current_provider in provider_attempts:
                try:
                    summary, model = _generate_with_provider(
                        provider=current_provider,
                        system_prompt=request_payload["system_prompt"],
                        user_message=request_payload["user_message"],
                    )
                    provider_used = current_provider
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = exc

            if not summary:
                raise RuntimeError(str(last_error) if last_error else "Live generation failed")
    except Exception as exc:  # noqa: BLE001
        if not fallback_to_demo:
            raise
        summary = _render_demo_summary(
            patient_context=request_payload["patient_context"],
            user_question=user_question,
        )
        provider_used = "demo"
        model = "local-clinical-template"
        fallback_used = True
        error_message = str(exc)

    return {
        "provider_requested": provider_requested,
        "provider_used": provider_used,
        "model": model,
        "fallback_used": fallback_used,
        "system_prompt": request_payload["system_prompt"],
        "patient_context": request_payload["patient_context"],
        "summary": summary,
        "error": error_message,
    }


def generate_longitudinal_patient_summary(
    db: Session,
    clinic_id: int,
    patient_id: int,
    provider: LLMProvider = "auto",
    user_question: str = DEFAULT_LONGITUDINAL_SUMMARY_QUESTION,
    fallback_to_demo: bool = True,
) -> dict[str, Any]:
    prompt = (
        f"{DEFAULT_LONGITUDINAL_SUMMARY_QUESTION}\n\n"
        f"Instruccion adicional del usuario: {user_question.strip()}"
    )
    return generate_patient_summary(
        db=db,
        clinic_id=clinic_id,
        patient_id=patient_id,
        provider=provider,
        user_question=prompt,
        fallback_to_demo=fallback_to_demo,
    )


def generate_clinical_note_draft(
    db: Session,
    clinic_id: int,
    patient_id: int,
    dictation: str,
    provider: LLMProvider = "auto",
    fallback_to_demo: bool = True,
) -> dict[str, Any]:
    prompt = (
        f"{DEFAULT_CLINICAL_NOTE_DRAFT_PROMPT}\n\n"
        f"Dictado medico:\n{dictation.strip()}"
    )
    return generate_patient_summary(
        db=db,
        clinic_id=clinic_id,
        patient_id=patient_id,
        provider=provider,
        user_question=prompt,
        fallback_to_demo=fallback_to_demo,
    )
