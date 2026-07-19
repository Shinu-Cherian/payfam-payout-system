import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


class AuditService:
    @staticmethod
    def log(
        db: Session,
        *,
        actor: User | None,
        action: str,
        entity_type: str,
        entity_id: int | None = None,
        details: dict[str, Any] | str = "",
    ) -> AuditLog:
        details_text = json.dumps(details, default=str) if isinstance(details, dict) else details
        audit_log = AuditLog(
            actor_user_id=actor.id if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details_text,
        )
        db.add(audit_log)
        return audit_log

