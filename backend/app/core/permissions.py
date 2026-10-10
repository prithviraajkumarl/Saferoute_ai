from enum import Enum
from typing import List
from app.core.exceptions import InsufficientPermissionsError


class UserRole(str, Enum):
    TOURIST = "tourist"
    RESPONDER = "responder"
    ADMINISTRATOR = "administrator"


def check_role(user_role: str, allowed_roles: List[UserRole]) -> bool:
    if user_role not in [role.value for role in allowed_roles]:
        raise InsufficientPermissionsError(required_role=",".join([r.value for r in allowed_roles]))
    return True
