from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class Campaign:
    id: str
    name: str
    campaign_type: str
    target_count: int
    processing_rate_per_hour: int = 3
    created_at: datetime = None
    status: str = "processing"
    progress: int = 0
    total_processed: int = 0

@dataclass
class ProgressData:
    percentage: int
    completed_batches: int
    messages_sent: int
    next_batch_in: str
    estimated_completion_time: Optional[datetime] = None
    time_elapsed: str = ""
    batch_progress: int = 0  # Progreso dentro del batch actual (0-100)

@dataclass
class ChartPoint:
    hour: float
    messages: int
    is_current: bool = False

@dataclass
class ChartData:
    points: List[ChartPoint]
    total_hours: float
    total_messages: int