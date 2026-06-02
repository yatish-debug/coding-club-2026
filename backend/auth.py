from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import bcrypt

from database import get_db
import models, schemas

# Secret configuration (in production, use environment variables)
SECRET_KEY = "SUPER_SECRET_KEY_FOR_GFGCOE_CODING_CLUB"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes session expiration

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Direct bcrypt checkpw handles salt parsing and validation
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        print(f"Bcrypt verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    # Direct bcrypt hashpw generates secure salt and hashes the bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 1. Base User Extraction
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# 2. Active User Check (Includes Student, Core, and Admin)
def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user profile"
        )
    return current_user

# 3. Core or Admin Level Check
def get_current_active_core_or_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    allowed = ["admin", "super_admin", "super admin", "core", "coordinator", "core_team", "core team"]
    if current_user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Core or Admin role required."
        )
    return current_user

# 4. Strict Admin Level Check
def get_current_active_admin(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    allowed = ["admin", "super_admin", "super admin"]
    if current_user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Admin role required."
        )
    return current_user
