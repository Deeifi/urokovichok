from typing import List, Dict, Any
from models import ScheduleRequest

def validate_workloads(data: ScheduleRequest) -> List[str]:
    errors = []
    
    teacher_names = {t.id: t.name for t in data.teachers}
    class_names = {c.id: c.name for c in data.classes}
    subject_names = {s.id: s.name for s in data.subjects}
    teacher_subjects = {t.id: set(t.subjects) for t in data.teachers}
    teacher_is_primary = {t.id: t.is_primary for t in data.teachers}
    
    active_plan_items = [p for p in data.plan if p.hours_per_week > 0]
    if not active_plan_items:
        errors.append("• План порожній: немає жодного уроку для розподілу")
        return errors
    
    seen_combinations = set()
    teacher_loads = {}
    class_loads = {}
    MAX_WEEKLY_SLOTS = 40
    
    for plan in data.plan:
        class_name = class_names.get(plan.class_id, f"ID: {plan.class_id}")
        subject_name = subject_names.get(plan.subject_id, f"ID: {plan.subject_id}")
        
        if plan.hours_per_week < 0:
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': від'ємна кількість годин ({plan.hours_per_week})")
            continue
        
        if plan.hours_per_week != int(plan.hours_per_week):
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': дробова кількість годин ({plan.hours_per_week})")
            continue
        
        if plan.hours_per_week <= 0:
            continue
        
        if plan.subject_id not in subject_names:
            errors.append(f"• Клас '{class_name}': невідомий предмет (ID: {plan.subject_id})")
            continue
        
        if plan.class_id not in class_names:
            errors.append(f"• Предмет '{subject_name}': невідомий клас (ID: {plan.class_id})")
            continue
        
        if plan.teacher_id not in teacher_names:
            if plan.teacher_id == "":
                errors.append(f"• Клас '{class_name}', предмет '{subject_name}': не вказано вчителя")
            else:
                errors.append(f"• Клас '{class_name}', предмет '{subject_name}': невідомий вчитель (ID: {plan.teacher_id})")
            continue
        
        teacher_name = teacher_names[plan.teacher_id]
        teacher_subs = teacher_subjects.get(plan.teacher_id, set())
        is_primary = teacher_is_primary.get(plan.teacher_id, False)
        
        try:
            grade = int(class_name.split('-')[0]) if '-' in class_name else int(class_name)
            is_primary_class = 1 <= grade <= 4
        except:
            is_primary_class = False
        
        can_teach = plan.subject_id in teacher_subs or (is_primary and is_primary_class)
        
        if not can_teach:
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': вчитель {teacher_name} не викладає цей предмет")
            continue
        
        combo = (plan.class_id, plan.subject_id)
        if combo in seen_combinations:
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': дублікат в плані")
            continue
        seen_combinations.add(combo)
        
        teacher_loads[plan.teacher_id] = teacher_loads.get(plan.teacher_id, 0) + plan.hours_per_week
        class_loads[plan.class_id] = class_loads.get(plan.class_id, 0) + plan.hours_per_week
    
    for t in data.teachers:
        t_id = t.id
        load = teacher_loads.get(t_id, 0)
        blocked_count = 0
        if t.availability:
            for day_slots in t.availability.values():
                blocked_count += len(day_slots)
        available_slots = MAX_WEEKLY_SLOTS - blocked_count
        if load > available_slots:
            name = teacher_names.get(t_id, t_id)
            errors.append(f"• Вчитель {name} має {load} год/тиждень, але з урахуванням графіка доступно лише {available_slots} слотів")
        elif load > MAX_WEEKLY_SLOTS:
            name = teacher_names.get(t_id, t_id)
            errors.append(f"• Вчитель {name} має {load} год/тиждень (абсолютний максимум {MAX_WEEKLY_SLOTS})")
    
    for c_id, load in class_loads.items():
        if load > MAX_WEEKLY_SLOTS:
            name = class_names.get(c_id, c_id)
            errors.append(f"• Клас {name} має {load} уроків/тиждень (максимум {MAX_WEEKLY_SLOTS})")
    
    return errors
