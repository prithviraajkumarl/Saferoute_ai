from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class SafeRouteException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "ERROR",
        extra: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra = extra or {}


class IncidentStateTransitionError(SafeRouteException):
    def __init__(self, current_state: str, attempted_state: str, reason: str = ""):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition from '{current_state}' to '{attempted_state}'. {reason}".strip(),
            error_code="INVALID_STATE_TRANSITION",
            extra={"current_state": current_state, "attempted_state": attempted_state},
        )


class EntityNotFoundError(SafeRouteException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_name} with identifier '{identifier}' was not found.",
            error_code="NOT_FOUND",
            extra={"entity": entity_name, "identifier": str(identifier)},
        )


class ProviderUnavailableError(SafeRouteException):
    def __init__(self, provider_name: str, detail: str = "Provider temporarily unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider_name}: {detail}",
            error_code="PROVIDER_UNAVAILABLE",
            extra={"provider": provider_name},
        )


class InsufficientPermissionsError(SafeRouteException):
    def __init__(self, required_role: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Action requires '{required_role}' privileges.",
            error_code="PERMISSION_DENIED",
            extra={"required_role": required_role},
        )
