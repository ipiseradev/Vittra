from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_gym_id, get_current_user
from app.db.session import get_db
from app.models.models import Client
from app.schemas.schemas import ClientCreate, ClientOut, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientOut])
def list_clients(
    search: str | None = Query(default=None, min_length=1, max_length=120),
    is_active: bool | None = None,
    gym_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user),
    current_gym_id: int | None = Depends(get_current_gym_id),
) -> list[ClientOut]:
    query = select(Client)

    effective_gym_id = gym_id if gym_id is not None else current_gym_id
    if effective_gym_id is not None:
        query = query.where(Client.gym_id == effective_gym_id)
    if is_active is not None:
        query = query.where(Client.is_active == is_active)
    if search:
        terms = [token for token in search.strip().split(" ") if token]
        if terms:
            search_clauses = []
            for token in terms:
                term = f"%{token}%"
                search_clauses.append(
                    or_(
                        Client.full_name.ilike(term),
                        Client.email.ilike(term),
                        Client.phone.ilike(term),
                    )
                )
            query = query.where(and_(*search_clauses))

    query = query.order_by(Client.created_at.desc()).offset(offset).limit(limit)
    return list(db.scalars(query).all())


@router.get("/{client_id}", response_model=ClientOut)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_gym_id: int | None = Depends(get_current_gym_id),
    _user=Depends(get_current_user),
) -> ClientOut:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if current_gym_id is not None and client.gym_id != current_gym_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def add_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_gym_id: int | None = Depends(get_current_gym_id),
    _user=Depends(get_current_user),
) -> ClientOut:
    target_gym_id = payload.gym_id if payload.gym_id is not None else current_gym_id
    existing = db.scalar(
        select(Client).where(
            func.lower(Client.email) == payload.email.lower(),
            Client.gym_id == target_gym_id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Client email already exists for this gym",
        )

    client = Client(**payload.model_dump(exclude={"gym_id"}), gym_id=target_gym_id)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_gym_id: int | None = Depends(get_current_gym_id),
    _user=Depends(get_current_user),
) -> ClientOut:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if current_gym_id is not None and client.gym_id != current_gym_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    changes = payload.model_dump(exclude_unset=True)
    target_gym_id = changes.get("gym_id", client.gym_id)
    if "email" in changes and changes["email"] != client.email:
        existing = db.scalar(
            select(Client).where(
                func.lower(Client.email) == changes["email"].lower(),
                Client.gym_id == target_gym_id,
            )
        )
        if existing and existing.id != client_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Client email already exists for this gym",
            )

    for key, value in changes.items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_gym_id: int | None = Depends(get_current_gym_id),
    _user=Depends(get_current_user),
) -> Response:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if current_gym_id is not None and client.gym_id != current_gym_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    client.is_active = False
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
