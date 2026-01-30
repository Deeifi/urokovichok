from solver import generate_schedule
from models import ScheduleRequest, Teacher, Subject, ClassGroup, TeachingPlanItem

def test_dispatcher():
    # Mock Data
    t1 = Teacher(id="t1", name="Mr. Smith", subjects=["math"])
    s1 = Subject(id="math", name="Mathematics")
    c1 = ClassGroup(id="c1", name="10-A")
    plan = [TeachingPlanItem(class_id="c1", subject_id="math", teacher_id="t1", hours_per_week=5)]
    
    # 1. Test PuLP
    print("\n--- Testing PuLP Strategy ---")
    req_pulp = ScheduleRequest(
        teachers=[t1], subjects=[s1], classes=[c1], plan=plan, 
        strategy="pulp"
    )
    res_pulp = generate_schedule(req_pulp)
    print(f"PuLP Result Status: {res_pulp['status']}")
    if res_pulp['status'] == 'success':
        print("PuLP successfully generated schedule via dispatcher.")
    else:
        print(f"PuLP Failed: {res_pulp.get('message')}")

    # 2. Test OR-Tools (Default)
    print("\n--- Testing OR-Tools Strategy ---")
    req_ortools = ScheduleRequest(
        teachers=[t1], subjects=[s1], classes=[c1], plan=plan, 
        strategy="ortools"
    )
    res_ortools = generate_schedule(req_ortools)
    print(f"OR-Tools Result Status: {res_ortools['status']}")
    if res_ortools['status'] == 'success':
        print("OR-Tools successfully generated schedule via dispatcher.")
    else:
        print(f"OR-Tools Failed: {res_ortools.get('message')}")

if __name__ == "__main__":
    test_dispatcher()
