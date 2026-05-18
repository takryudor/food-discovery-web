from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.db.models import User

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Xác thực Supabase JWT token và trả về thông tin User từ Database.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="NOT_AUTHENTICATED",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Giải mã token dùng Supabase JWT Secret
        payload = jwt.decode(
            token, 
            settings.supabase_jwt_secret, 
            algorithms=[settings.supabase_jwt_algorithm],
            audience="authenticated" # Supabase mặc định set audience là 'authenticated'
        )
        supabase_id: str = payload.get("sub")
        if supabase_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="INVALID_TOKEN_PAYLOAD",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="COULD_NOT_VALIDATE_CREDENTIALS",
        )

    # Tìm User trong DB dựa trên supabase_id
    user = db.query(User).filter(User.supabase_id == supabase_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="USER_NOT_FOUND",
        )
    
    return user
