from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.supabase_jwt import decode_supabase_access_token
from app.db.session import get_db
from app.db.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


def _decode_supabase_token(token: str) -> dict:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="NOT_AUTHENTICATED",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_supabase_access_token(token)
        supabase_id = payload.get("sub")
        if supabase_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="INVALID_TOKEN_PAYLOAD",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="COULD_NOT_VALIDATE_CREDENTIALS",
        )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Xác thực Supabase JWT token và trả về User đã có trong DB."""
    payload = _decode_supabase_token(token)
    supabase_id: str = payload["sub"]

    user = db.query(User).filter(User.supabase_id == supabase_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="USER_NOT_FOUND",
        )

    return user


def get_or_create_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Đồng bộ user từ Supabase JWT — tạo bản ghi mới nếu chưa tồn tại."""
    payload = _decode_supabase_token(token)
    supabase_id: str = payload["sub"]

    user = db.query(User).filter(User.supabase_id == supabase_id).first()
    if user:
        return user

    email = payload.get("email") or f"{supabase_id}@unknown.local"
    metadata = payload.get("user_metadata") or {}
    display_name = metadata.get("full_name") or metadata.get("name") or email.split("@")[0]

    user = User(
        supabase_id=supabase_id,
        email=email,
        display_name=display_name,
        avatar_url=metadata.get("avatar_url"),
        role=UserRole.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_current_admin(
    current_user: User = Depends(get_or_create_current_user),
) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ADMIN_REQUIRED",
        )
    return current_user
