from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_clinic_id,
    get_current_user,
    get_db,
    require_permission,
)
from app.models.models import User
from app.schemas.schemas import (
    AIGenerationResponse,
    PatientAssistantChatRequest,
    PatientAssistantChatResponse,
    PatientCreate,
    PatientOut,
    PatientUpdate,
    Patient360Out,
)
from app.services.ai_service import (
    generate_clinical_note_draft,
    generate_longitudinal_patient_summary,
    generate_patient_summary,
)
from app.services.services import (
    count_patients_by_clinic,
    create_patient,
    get_patient,
    get_patient_360,
    get_patients_by_clinic,
    log_audit,
    safe_log_audit,
    update_patient,
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient_endpoint(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patients:write")),
) -> PatientOut:
    patient = create_patient(db, clinic_id, payload)
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="Patient",
        resource_id=patient.id,
        new_value=f"Patient: {patient.full_name}",
    )
    return patient


@router.get("", response_model=list[PatientOut])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patients:read")),
) -> list[PatientOut]:
    _ = current_user
    return get_patients_by_clinic(
        db,
        clinic_id,
        search=search,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


@router.get("/stats", response_model=dict)
def get_patient_stats(
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patients:read")),
) -> dict:
    _ = current_user
    total = count_patients_by_clinic(db, clinic_id)
    return {"total_patients": total}


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient_endpoint(
    patient_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patients:read")),
) -> PatientOut:
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    safe_log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="READ",
        resource_type="Patient",
        resource_id=patient.id,
    )
    return patient


@router.get("/{patient_id}/overview", response_model=Patient360Out)
def get_patient_overview(
    patient_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patient360:read")),
) -> Patient360Out:
    data = get_patient_360(db, clinic_id, patient_id)
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    safe_log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="READ",
        resource_type="Patient360",
        resource_id=patient_id,
    )
    return Patient360Out(**data)


@router.post("/{patient_id}/assistant/chat", response_model=PatientAssistantChatResponse)
def chat_with_patient_assistant(
    patient_id: int,
    payload: PatientAssistantChatRequest,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("ai:use")),
) -> PatientAssistantChatResponse:
    try:
        result = generate_patient_summary(
            db=db,
            clinic_id=clinic_id,
            patient_id=patient_id,
            provider=payload.provider,
            user_question=payload.message,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant could not generate a response",
        ) from exc

    safe_log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="READ",
        resource_type="PatientAssistant",
        resource_id=patient_id,
        new_value=f"Provider: {result['provider_used']}",
    )
    return PatientAssistantChatResponse(
        provider_requested=result["provider_requested"],
        provider_used=result["provider_used"],
        model=result["model"],
        fallback_used=result["fallback_used"],
        system_prompt=result["system_prompt"],
        patient_context=result["patient_context"],
        reply=result["summary"],
        error=result["error"],
    )


@router.post("/{patient_id}/assistant/longitudinal-summary", response_model=AIGenerationResponse)
def generate_longitudinal_summary(
    patient_id: int,
    payload: PatientAssistantChatRequest,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("ai:use")),
) -> AIGenerationResponse:
    result = generate_longitudinal_patient_summary(
        db=db,
        clinic_id=clinic_id,
        patient_id=patient_id,
        provider=payload.provider,
        user_question=payload.message,
    )
    safe_log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="READ",
        resource_type="PatientLongitudinalSummary",
        resource_id=patient_id,
        new_value=f"Provider: {result['provider_used']}",
    )
    return AIGenerationResponse(
        provider_requested=result["provider_requested"],
        provider_used=result["provider_used"],
        model=result["model"],
        fallback_used=result["fallback_used"],
        system_prompt=result["system_prompt"],
        patient_context=result["patient_context"],
        reply=result["summary"],
        error=result["error"],
    )


@router.post("/{patient_id}/assistant/note-draft", response_model=AIGenerationResponse)
def generate_note_draft(
    patient_id: int,
    payload: PatientAssistantChatRequest,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("ai:use")),
) -> AIGenerationResponse:
    result = generate_clinical_note_draft(
        db=db,
        clinic_id=clinic_id,
        patient_id=patient_id,
        provider=payload.provider,
        dictation=payload.message,
    )
    safe_log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="ClinicalNoteDraft",
        resource_id=patient_id,
        new_value=f"Provider: {result['provider_used']}",
    )
    return AIGenerationResponse(
        provider_requested=result["provider_requested"],
        provider_used=result["provider_used"],
        model=result["model"],
        fallback_used=result["fallback_used"],
        system_prompt=result["system_prompt"],
        patient_context=result["patient_context"],
        reply=result["summary"],
        error=result["error"],
    )


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient_endpoint(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patients:write")),
) -> PatientOut:
    patient = update_patient(db, clinic_id, patient_id, payload)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="Patient",
        resource_id=patient.id,
    )
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    clinic_id: int = Depends(get_clinic_id),
    current_user: User = Depends(require_permission("patients:write")),
) -> None:
    patient = get_patient(db, clinic_id, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    update_patient(db, clinic_id, patient_id, PatientUpdate(is_active=False))
    log_audit(
        db,
        clinic_id=clinic_id,
        user_id=current_user.id,
        action="DELETE",
        resource_type="Patient",
        resource_id=patient.id,
    )
