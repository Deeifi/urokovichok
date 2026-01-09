from solver import generate_schedule
from models import ScheduleRequest, Teacher, Subject, ClassGroup, TeachingPlanItem
import json

# Recreating INITIAL_DATA from App.tsx
data_dict = {
  "teachers": [
    { "id": '1', "name": 'Іваненко', "subjects": ['math', 'phys'] },
    { "id": '2', "name": 'Петренко', "subjects": ['ukr', 'lit'] },
    { "id": '3', "name": 'Сидоров', "subjects": ['eng', 'hist'] }
  ],
  "classes": [
    { "id": '1', "name": '5-А' },
    { "id": '2', "name": '9-Б' }
  ],
  "subjects": [
    { "id": 'math', "name": 'Математика' },
    { "id": 'phys', "name": 'Фізика' },
    { "id": 'ukr', "name": 'Українська мова' },
    { "id": 'lit', "name": 'Література' },
    { "id": 'eng', "name": 'Англійська мова' },
    { "id": 'hist', "name": 'Історія' }
  ],
  "plan": [
    { "class_id": '1', "subject_id": 'math', "teacher_id": '1', "hours_per_week": 5 },
    { "class_id": '1', "subject_id": 'ukr', "teacher_id": '2', "hours_per_week": 4 },
    { "class_id": '2', "subject_id": 'phys', "teacher_id": '1', "hours_per_week": 3 },
    { "class_id": '2', "subject_id": 'eng', "teacher_id": '3', "hours_per_week": 4 }
  ]
}

try:
    request = ScheduleRequest(**data_dict)
    print("Request object created successfully.")
    result = generate_schedule(request)
    print("Result status:", result.get("status"))
    print("Result schedule length:", len(result.get("schedule", [])))
    print("First 2 items:", result.get("schedule", [])[:2])
except Exception as e:
    print(f"Error: {e}")
