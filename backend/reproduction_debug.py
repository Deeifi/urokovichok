import sys
import os

sys.path.append(os.path.join(os.getcwd()))

from models import ScheduleRequest, Teacher, ClassGroup, Subject, TeachingPlanItem
from solver import generate_schedule

data = ScheduleRequest(
    teachers=[Teacher(id=f't{i}', name=f'Teacher {i}', subjects=[]) for i in range(1, 28)],
    classes=[ClassGroup(id=str(i), name=f'Class {i}') for i in range(1, 23)],
    subjects=[Subject(id=str(i), name=f'Subject {i}') for i in range(1, 18)],
    plan=[]
)

plan = []

def add(cid, sid, tid, hours):
    plan.append(TeachingPlanItem(class_id=str(cid), subject_id=str(sid), teacher_id=tid, hours_per_week=hours))

# Primary (1-8)
for cid in range(1, 9):
    add(cid, 1, 't1' if cid % 2 != 0 else 't23', 5)
    add(cid, 2, 't5' if cid % 2 != 0 else 't24', 5)
    add(cid, 3, 't7', 4)
    add(cid, 4, 't8' if cid % 2 != 0 else 't25', 4)
    add(cid, 14, 't18' if cid % 2 != 0 else 't19', 4)
    add(cid, 16, 't21', 4)
    add(cid, 17, 't22', 4)

# Middle (9-18)
m_teachers = ['t1', 't2', 't23', 't1', 't2', 't23', 't1', 't2', 't20', 't20']
u_teachers = ['t5', 't24', 't6', 't26', 't5', 't24', 't6', 't26', 't5', 't24']
bio_teachers = ['t13', 't15', 't13', 't15', 't13', 't15', 't13', 't15', 't15', 't15']
info_teachers = ['t17', 't13', 't17', 't13', 't17', 't13', 't17', 't13', 't17', 't17']

for cid in range(9, 19):
    idx = cid - 9
    add(cid, 1, m_teachers[idx], 5)
    add(cid, 2, u_teachers[idx], 5)
    add(cid, 4, 't9' if cid % 2 != 0 else 't25', 4)
    add(cid, 14, 't27' if cid % 2 != 0 else 't19', 4)
    add(cid, 10, 't14' if cid % 2 != 0 else 't26', 4)
    add(cid, 12, 't16' if cid % 2 != 0 else 't20', 4)
    add(cid, 9, bio_teachers[idx], 4)
    add(cid, 13, info_teachers[idx], 4)

# senior (19-22)
for cid in range(19, 23):
    isA = cid % 2 != 0
    add(cid, 6, 't3' if isA else 't4', 4)
    add(cid, 7, 't3' if isA else 't4', 4)
    add(cid, 2, 't6', 5)
    add(cid, 4, 't9', 4)
    add(cid, 5, 't10' if isA else 't11', 4)
    add(cid, 8, 't12', 4)
    add(cid, 11, 't15' if isA else 't14', 5)
    add(cid, 14, 't27', 4)

data.plan = plan
data.timeout = 60 # Increase timeout for large plan
data.strategy = "pulp"

# Fix: Teachers MUST have subjects they teach in their profile to pass validation
teacher_map = {t.id: t for t in data.teachers}
for p in plan:
    t = teacher_map.get(p.teacher_id)
    if t and p.subject_id not in t.subjects:
        t.subjects.append(p.subject_id)

print(f"Testing with {len(data.classes)} classes and {len(plan)} plan items...")
print(f"Total hours: {sum(p.hours_per_week for p in plan)}")

print("Running solver test...")
result = generate_schedule(data)
print(f"Status: {result['status']}")
if result["status"] == "error":
    print(f"Message: {result['message']}")
else:
    print(f"Schedule length: {len(result['schedule'])}")
    
    # Automated Verification
    from collections import defaultdict
    
    schedule = result['schedule']
    
    class_slots = defaultdict(list)
    teacher_slots = defaultdict(list)
    class_daily_periods = defaultdict(list)
    
    errors = []
    
    for item in schedule:
        c_id = item['class_id']
        t_id = item['teacher_id']
        day = item['day']
        p = item['period']
        
        # Check Class Overlap
        key = (c_id, day, p)
        if key in class_slots:
            errors.append(f"CLASS OVERLAP: {c_id} at {day} period {p}")
        class_slots[key].append(item)
        
        # Check Teacher Overlap
        t_key = (t_id, day, p)
        if t_key in teacher_slots:
            errors.append(f"TEACHER OVERLAP: {t_id} at {day} period {p}")
        teacher_slots[t_key].append(item)
        
        if p > 0: # Ignore period 0 for gaps
            class_daily_periods[(c_id, day)].append(p)

    # Check Gaps
    for (c_id, day), periods in class_daily_periods.items():
        periods.sort()
        if not periods: continue
        
        min_p = periods[0]
        max_p = periods[-1]
        
        # Expect strict sequence
        expected = list(range(min_p, max_p + 1))
        if periods != expected:
            errors.append(f"GAP DETECTED: {c_id} on {day}. Periods: {periods}")

    if errors:
        print("\nVerification FAILED with errors:")
        for e in errors[:10]:
            print(e)
    with open("verification_result.txt", "w", encoding="utf-8") as f:
        if errors:
            f.write("Verification FAILED with errors:\n")
            for e in errors[:50]:
                f.write(e + "\n")
            if len(errors) > 50: f.write(f"... and {len(errors)-50} more.\n")
        else:
            f.write("Verification PASSED: No overlaps, no student gaps (1+).\n")
    
    # Print to stdout as well (just in case)
    if errors:
        print("Verification FAILED (see verification_result.txt)")
    else:
        print("Verification PASSED (see verification_result.txt)")
