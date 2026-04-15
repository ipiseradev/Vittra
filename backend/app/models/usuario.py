from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    rol = Column(String)  # admin, medico, recepcionista
