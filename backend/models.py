from pydantic import BaseModel
from typing import List, Optional

class Subject(BaseModel):
    id: str
    name: str



class Teacher(BaseModel):
    id: str
    name: str
    subjects: List[str]  # List of Subject IDs
    is_primary: bool = False
    prefers_period_zero: bool = False  # Teacher prefers early morning lessons
    photo: Optional[str] = None
    availability: Optional[dict[str, List[int]]] = None # Blocked periods per day

class ClassGroup(BaseModel):
    id: str
    name: str
    excluded_subjects: List[str] = []  # List of Subject IDs not applicable for this class

class TeachingPlanItem(BaseModel):
    class_id: str
    subject_id: str
    teacher_id: str
    hours_per_week: int

class ScheduleRequest(BaseModel):
    teachers: List[Teacher]
    subjects: List[Subject]
    classes: List[ClassGroup]
    plan: List[TeachingPlanItem]
    strategy: Optional[str] = "ortools" # "ortools" or "pulp" or "genetic"
    timeout: Optional[int] = 30
    genetic_population_size: Optional[int] = 8
    genetic_generations: Optional[int] = 3
    genetic_mutation_rate: Optional[float] = 0.4
