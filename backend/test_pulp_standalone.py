from logic.pulp_solver.core import solve_with_pulp
from models import ScheduleRequest, Teacher, Subject, ClassGroup, TeachingPlanItem

def test_run():
    # Mock Data
    t1 = Teacher(id="t1", name="Mr. Smith", subjects=["math"])
    s1 = Subject(id="math", name="Mathematics")
    c1 = ClassGroup(id="c1", name="10-A")
    
    plan = [
        TeachingPlanItem(class_id="c1", subject_id="math", teacher_id="t1", hours_per_week=5)
    ]
    
    req = ScheduleRequest(
        teachers=[t1],
        subjects=[s1],
        classes=[c1],
        plan=plan
    )
    
    print("Starting PuLP Test...")
    res, err = solve_with_pulp(req, periods=[1, 2, 3, 4, 5, 6, 7], timeout=30)
    
    if res:
        print("Success! Generated schedule:")
        for lesson in res:
            print(lesson)
    else:
        print(f"Failed: {err}")

if __name__ == "__main__":
    test_run()
