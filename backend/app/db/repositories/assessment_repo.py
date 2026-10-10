from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.db.models.assessment import RouteAssessment, RouteAssessmentEvidence, DataSnapshot


class AssessmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, assessment_id: str) -> Optional[RouteAssessment]:
        return self.db.execute(select(RouteAssessment).where(RouteAssessment.id == assessment_id)).scalar_one_or_none()

    def create(self, assessment: RouteAssessment, evidences: List[RouteAssessmentEvidence]) -> RouteAssessment:
        self.db.add(assessment)
        self.db.flush()

        for ev in evidences:
            ev.assessment_id = assessment.id
            self.db.add(ev)

        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def save_snapshot(self, provider_name: str, endpoint: str, payload_json: str, status: str = "SUCCESS") -> DataSnapshot:
        snapshot = DataSnapshot(
            provider_name=provider_name,
            endpoint=endpoint,
            payload_json=payload_json,
            status=status,
        )
        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def list_recent(self, limit: int = 20) -> List[RouteAssessment]:
        return list(self.db.execute(select(RouteAssessment).order_by(desc(RouteAssessment.created_at)).limit(limit)).scalars().all())
