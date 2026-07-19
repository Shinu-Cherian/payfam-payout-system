from datetime import datetime

from app.schemas.common import ORMModel, Page


class AuditLogRead(ORMModel):
    id: int
    actor_user_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    details: str
    created_at: datetime


class AuditLogList(Page):
    items: list[AuditLogRead]

