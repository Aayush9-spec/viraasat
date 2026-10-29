"""Re-export authentication and authorization dependencies from app.core.deps."""
from app.core.deps import (
    get_current_user,
    get_optional_user,
    require_role,
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

__all__ = [
    "get_current_user",
    "get_optional_user",
    "require_role",
    "HTTPAuthorizationCredentials",
    "HTTPBearer",
]
