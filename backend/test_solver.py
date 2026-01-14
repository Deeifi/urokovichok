import pytest
from models import ScheduleRequest, Teacher, Subject, ClassGroup, TeachingPlanItem
from solver import generate_schedule

def test_basic_schedule_generation():
    # Setup minimal data
    subjects = [Subject(id="math", name="Math")]
    teachers = [Teacher(id="t1", name="John Doe", subjects=["math"])]
    classes = [ClassGroup(id="c1", name="Class A")]
    plan = [TeachingPlanItem(class_id="c1", subject_id="math", teacher_id="t1", hours_per_week=2)]
    
    request = ScheduleRequest(
        teachers=teachers,
        subjects=subjects,
        classes=classes,
        plan=plan
    )
    
    result = generate_schedule(request)
    
    assert result["status"] == "success"
    assert len(result["schedule"]) == 2
    
    # Check if both lessons are for class A and teacher T1
    for lesson in result["schedule"]:
        assert lesson["class_id"] == "c1"
        assert lesson["teacher_id"] == "t1"
        assert lesson["subject_id"] == "math"

def test_teacher_overload_validation():
    # If teacher has more hours than available slots (simplistic check)
    subjects = [Subject(id="math", name="Math")]
    teachers = [Teacher(id="t1", name="John Doe", subjects=["math"])]
    classes = [ClassGroup(id="c1", name="Class A")]
    # 50 hours is more than 5 days * 8 periods = 40.
    plan = [TeachingPlanItem(class_id="c1", subject_id="math", teacher_id="t1", hours_per_week=50)]
    
    request = ScheduleRequest(
        teachers=teachers,
        subjects=subjects,
        classes=classes,
        plan=plan
    )
    
    result = generate_schedule(request)
    # Validation in solver.py returns "error" for overload
    assert result["status"] == "error"
    assert "Помилка валідації" in result["message"]
