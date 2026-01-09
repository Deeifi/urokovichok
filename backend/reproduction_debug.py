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

# Senior (19-22)
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

print(f"Testing with {len(data.classes)} classes and {len(plan)} plan items...")
print(f"Total hours: {sum(p.hours_per_week for p in plan)}")

print("Running solver test...")
result = generate_schedule(data)
print(f"Status: {result['status']}")
if result["status"] == "error":
    print(f"Message: {result['message']}")
else:
    print(f"Schedule length: {len(result['schedule'])}")
