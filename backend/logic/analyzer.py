from typing import List, Dict, Any
from models import ScheduleRequest

def analyze_violations(schedule: List[Dict[str, Any]], data: ScheduleRequest) -> List[str]:
    violations = []
    class_names = {c.id: c.name for c in data.classes}
    teacher_names = {t.id: t.name for t in data.teachers}
    subject_names = {s.id: s.name for s in data.subjects}
    
    plan_map = {}
    for p in data.plan:
        if p.hours_per_week > 0:
            plan_map[(p.class_id, p.subject_id)] = {
                "hours": p.hours_per_week,
                "teacher_id": p.teacher_id
            }
    
    VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri"}
    actual_counts = {}
    
    for l in schedule:
        if l["day"] not in VALID_DAYS:
            violations.append(f"• Невірний день: {l['day']} (має бути Mon/Tue/Wed/Thu/Fri)")
        if not (0 <= l["period"] <= 8):
            c_name = class_names.get(l["class_id"], l["class_id"])
            violations.append(f"• Клас {c_name} ({l['day']}): невірний урок {l['period']} (має бути 0-8)")
        if l["class_id"] not in class_names:
            violations.append(f"• Урок посилається на невідомий клас (ID: {l['class_id']})")
        if l["subject_id"] not in subject_names:
            c_name = class_names.get(l["class_id"], l["class_id"])
            violations.append(f"• Клас {c_name}: невідомий предмет (ID: {l['subject_id']})")
        if l["teacher_id"] not in teacher_names:
            c_name = class_names.get(l["class_id"], l["class_id"])
            s_name = subject_names.get(l["subject_id"], l["subject_id"])
            violations.append(f"• Клас {c_name}, предмет {s_name}: невідомий вчитель (ID: {l['teacher_id']})")
        key = (l["class_id"], l["subject_id"])
        actual_counts[key] = actual_counts.get(key, 0) + 1
    
    all_keys = set(plan_map.keys()) | set(actual_counts.keys())
    missing_lessons = []
    extra_lessons = []
    for key in all_keys:
        expected = plan_map.get(key, {}).get("hours", 0)
        actual = actual_counts.get(key, 0)
        if actual < expected:
            missing_lessons.append((class_names.get(key[0], key[0]), subject_names.get(key[1], key[1]), expected - actual, expected, actual))
        elif actual > expected:
            extra_lessons.append((class_names.get(key[0], key[0]), subject_names.get(key[1], key[1]), actual - expected, expected, actual))
    
    missing_lessons.sort(key=lambda x: x[2], reverse=True)
    extra_lessons.sort(key=lambda x: x[2], reverse=True)
    
    for c_name, s_name, missing, expected, actual in missing_lessons:
        violations.append(f"• Неможливо додати {missing} урок(ів) з '{s_name}' в клас {c_name} (заплановано {expected}, розміщено {actual})")
    for c_name, s_name, extra, expected, actual in extra_lessons:
        violations.append(f"• Зайвий {extra} урок(ів) з '{s_name}' в класі {c_name} (заплановано {expected}, розміщено {actual})")
    
    if missing_lessons:
        total_missing = sum(m[2] for m in missing_lessons)
        total_planned = sum(p.hours_per_week for p in data.plan if p.hours_per_week > 0)
        violations.append(f"**Всього не розміщено: {total_missing} уроків з {total_planned} запланованих**")
    
    for l in schedule:
        key = (l["class_id"], l["subject_id"])
        if key in plan_map:
            expected_teacher = plan_map[key]["teacher_id"]
            if l["teacher_id"] != expected_teacher:
                c_name = class_names.get(l["class_id"], l["class_id"])
                s_name = subject_names.get(l["subject_id"], l["subject_id"])
                expected_name = teacher_names.get(expected_teacher, expected_teacher)
                actual_name = teacher_names.get(l["teacher_id"], l["teacher_id"])
                violations.append(f"• Клас {c_name}, предмет {s_name}: невірний вчитель ({actual_name} замість {expected_name})")
    
    class_days = {}
    for l in schedule:
        key = (l["class_id"], l["day"])
        if key not in class_days: class_days[key] = []
        class_days[key].append(l["period"])
    
    for (c_id, day), periods in class_days.items():
        periods.sort()
        c_name = class_names.get(c_id, c_id)
        if periods and periods[0] > 1:
            violations.append(f"• {c_name} ({day}): починає з {periods[0]}-го уроку замість 1-го")
        for i in range(len(periods) - 1):
            if periods[i+1] - periods[i] > 1:
                violations.append(f"• {c_name} ({day}): має вікно між {periods[i]} та {periods[i+1]} уроками")
    
    teacher_slots = {}
    for l in schedule:
        key = (l["teacher_id"], l["day"], l["period"])
        if key not in teacher_slots: teacher_slots[key] = []
        teacher_slots[key].append(l["class_id"])
    for (t_id, day, period), class_ids in teacher_slots.items():
        if len(class_ids) > 1:
            t_name = teacher_names.get(t_id, t_id)
            class_list = ", ".join([class_names.get(c, c) for c in class_ids])
            violations.append(f"• Вчитель {t_name} ({day}, урок {period}): одночасно в класах {class_list}")
    
    return violations
