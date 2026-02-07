from passlib.context import CryptContext 
import hashlib
from datetime import datetime, timedelta
from jose import jwt, JWTError


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

secret_key = "23909d861fe0451f908a39c905fa8015cc632f91c3cadfb5496e6442b5f76936"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    # Step 1: SHA-256 hash (fixed length)
    sha256_pw = hashlib.sha256(password.encode("utf-8")).hexdigest()
    # Step 2: bcrypt the hash
    return pwd_context.hash(sha256_pw)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    sha256_pw = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(sha256_pw, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret_key, algorithm=ALGORITHM)
