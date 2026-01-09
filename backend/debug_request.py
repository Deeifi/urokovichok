import urllib.request
import json
import urllib.error

payload = {
  "teachers": [
    { "id": "1", "name": "Іваненко", "subjects": ["math", "phys"] },
    { "id": "2", "name": "Петренко", "subjects": ["ukr", "lit"] },
    { "id": "3", "name": "Сидоров", "subjects": ["eng", "hist"] }
  ],
  "classes": [
    { "id": "1", "name": "5-А", "grade": 5 },
    { "id": "2", "name": "9-Б", "grade": 9 }
  ],
  "subjects": [
    { "id": "math", "name": "Математика" },
    { "id": "phys", "name": "Фізика" },
    { "id": "ukr", "name": "Українська мова" },
    { "id": "lit", "name": "Література" },
    { "id": "eng", "name": "Англійська мова" },
    { "id": "hist", "name": "Історія" }
  ],
  "plan": [
    { "class_id": "1", "subject_id": "math", "teacher_id": "1", "hours_per_week": 5 },
    { "class_id": "1", "subject_id": "ukr", "teacher_id": "2", "hours_per_week": 4 },
    { "class_id": "2", "subject_id": "phys", "teacher_id": "1", "hours_per_week": 3 },
    { "class_id": "2", "subject_id": "eng", "teacher_id": "3", "hours_per_week": 4 }
  ]
}

url = "http://127.0.0.1:8000/api/generate"
headers = {'Content-Type': 'application/json'}
data = json.dumps(payload).encode('utf-8')

req = urllib.request.Request(url, data=data, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
