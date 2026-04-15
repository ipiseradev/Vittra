from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.core.security import verificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return payload

def role_required(required_role: str):
    def wrapper(user=Depends(get_current_user)):
        if user.get("rol") != required_role:
            raise HTTPException(status_code=403, detail="No autorizado")
        return user
    return wrapper
