import random
from typing import List, Dict, Any, Optional
from models import ScheduleRequest
import time
import collections
from ortools.sat.python import cp_model

def generate_schedule(data: ScheduleRequest) -> Dict[str, Any]:
    # Pass 0: Pre-validation
    validation_errors = validate_workloads(data)
    if validation_errors:
        return {
            "status": "error",
            "message": "Помилка валідації вхідних даних:\n" + "\n".join(validation_errors)
        }

    # Pass 1: Strict Solve (Periods 1-7, Hard Constraints)
    # If this succeeds, we get a perfect schedule.
    print("Attempting STRICT solve (Periods 1-7)...")
    result, error = ortools_solve(data, list(range(1, 8)), strict=True)
    if result:
        # DOUBLE CHECK: Even if solver says "optimal", verify violations manually.
        # This is a safety net against model loopholes.
        violations = analyze_violations(result, data)
        if not violations:
            print("Strict solve successful and valid!")
            return {"status": "success", "schedule": result}
        else:
            print(f"Strict solve produced result but with violations (Model Loophole?): {violations}")
            if not violations:
                violations = ["• Solver не зміг знайти ідеальне рішення, але конкретні порушення не виявлені. Спробуйте зменшити навантаження або збільшити гнучкість плану."]
            return {
                "status": "conflict", 
                "schedule": result, 
                "violations": violations
            }
    
    # Pass 2: Diagnostic Solve (Periods 1-7, Soft Constraints)
    # If Strict fails, we run this to see WHAT failed.
    print("Strict solve failed. Attempting DIAGNOSTIC solve...")
    result, error = ortools_solve(data, list(range(1, 8)), strict=False)
    
    if result:
        # Optimize period 0 usage (move lessons to periods 1-7 if possible)
        result = optimize_period_zero(result, data)
        
        # Analyze violations in the result
        violations = analyze_violations(result, data)
        print(f"Diagnostic solve returned {len(result)} lessons, found {len(violations)} violations")
        
        # Fallback: if no violations found but we're in conflict state, add generic message
        if not violations:
            violations = ["• Solver не зміг знайти ідеальне рішення, але конкретні порушення не виявлені. Спробуйте зменшити навантаження або збільшити гнучкість плану."]
        
        return {
            "status": "conflict", 
            "schedule": result, 
            "violations": violations
        }
    
    # Fallback to period 0 if even diagnostic failed (rare)
    print("Diagnostic failed for 1-7. Trying 0-7...")
    result, error = ortools_solve(data, list(range(0, 8)), strict=False)
    if result:
        # Optimize period 0 usage (move lessons to periods 1-7 if possible)
        result = optimize_period_zero(result, data)
        
        violations = analyze_violations(result, data)
        if not violations:
            violations = ["• Solver не зміг знайти ідеальне рішення, але конкретні порушення не виявлені. Спробуйте зменшити навантаження або збільшити гнучкість плану."]
        return {
            "status": "conflict",
            "schedule": result,
            "violations": violations
        }

    return {"status": "error", "message": "Неможливо згенерувати навіть частковий розклад. Перевірте вхідні дані."}

def validate_workloads(data: ScheduleRequest) -> List[str]:
    errors = []
    
    # Build lookup dictionaries
    teacher_names = {t.id: t.name for t in data.teachers}
    class_names = {c.id: c.name for c in data.classes}
    subject_names = {s.id: s.name for s in data.subjects}
    teacher_subjects = {t.id: set(t.subjects) for t in data.teachers}
    teacher_is_primary = {t.id: t.is_primary for t in data.teachers}
    
    # Check 0: Empty plan
    active_plan_items = [p for p in data.plan if p.hours_per_week > 0]
    if not active_plan_items:
        errors.append("• План порожній: немає жодного уроку для розподілу")
        return errors  # No point checking further
    
    # Track for duplicate detection
    seen_combinations = set()  # (class_id, subject_id)
    
    # Track loads
    teacher_loads = {}  # t_id -> hours
    class_loads = {}    # c_id -> hours
    MAX_WEEKLY_SLOTS = 40  # 5 days * 8 periods (0-7)
    
    for plan in data.plan:
        class_name = class_names.get(plan.class_id, f"ID: {plan.class_id}")
        subject_name = subject_names.get(plan.subject_id, f"ID: {plan.subject_id}")
        
        # Check 1: Invalid hours
        if plan.hours_per_week < 0:
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': від'ємна кількість годин ({plan.hours_per_week})")
            continue
        
        if plan.hours_per_week != int(plan.hours_per_week):
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': дробова кількість годин ({plan.hours_per_week})")
            continue
        
        if plan.hours_per_week <= 0:
            continue  # Skip inactive items
        
        # Check 2: Unknown subject
        if plan.subject_id not in subject_names:
            errors.append(f"• Клас '{class_name}': невідомий предмет (ID: {plan.subject_id})")
            continue
        
        # Check 3: Unknown class
        if plan.class_id not in class_names:
            errors.append(f"• Предмет '{subject_name}': невідомий клас (ID: {plan.class_id})")
            continue
        
        # Check 4: Unknown or empty teacher
        if plan.teacher_id not in teacher_names:
            if plan.teacher_id == "":
                errors.append(f"• Клас '{class_name}', предмет '{subject_name}': не вказано вчителя")
            else:
                errors.append(f"• Клас '{class_name}', предмет '{subject_name}': невідомий вчитель (ID: {plan.teacher_id})")
            continue
        
        # Check 5: Teacher qualification (can they teach this subject?)
        teacher_name = teacher_names[plan.teacher_id]
        teacher_subs = teacher_subjects.get(plan.teacher_id, set())
        is_primary = teacher_is_primary.get(plan.teacher_id, False)
        
        # Determine if class is primary (grades 1-4)
        try:
            grade = int(class_name.split('-')[0]) if '-' in class_name else int(class_name)
            is_primary_class = 1 <= grade <= 4
        except:
            is_primary_class = False
        
        # Teacher must either:
        # - Have this subject in their subjects list, OR
        # - Be a primary teacher (is_primary=True) teaching a primary class (1-4)
        can_teach = plan.subject_id in teacher_subs or (is_primary and is_primary_class)
        
        if not can_teach:
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': вчитель {teacher_name} не викладає цей предмет")
            continue
        
        # Check 6: Duplicates (same class + subject combination)
        combo = (plan.class_id, plan.subject_id)
        if combo in seen_combinations:
            errors.append(f"• Клас '{class_name}', предмет '{subject_name}': дублікат в плані")
            continue
        seen_combinations.add(combo)
        
        # Accumulate loads
        teacher_loads[plan.teacher_id] = teacher_loads.get(plan.teacher_id, 0) + plan.hours_per_week
        class_loads[plan.class_id] = class_loads.get(plan.class_id, 0) + plan.hours_per_week
    
    for t in data.teachers:
        t_id = t.id
        load = teacher_loads.get(t_id, 0)
        
        # Calculate available slots based on availability matrix
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
    
    # Check 8: Class overload
    for c_id, load in class_loads.items():
        if load > MAX_WEEKLY_SLOTS:
            name = class_names.get(c_id, c_id)
            errors.append(f"• Клас {name} має {load} уроків/тиждень (максимум {MAX_WEEKLY_SLOTS})")
    
    return errors

def analyze_violations(schedule: List[Dict[str, Any]], data: ScheduleRequest) -> List[str]:
    violations = []
    
    # Build lookup dictionaries
    class_names = {c.id: c.name for c in data.classes}
    teacher_names = {t.id: t.name for t in data.teachers}
    subject_names = {s.id: s.name for s in data.subjects}
    
    # Build plan lookup: (class_id, subject_id) -> expected data
    plan_map = {}
    for p in data.plan:
        if p.hours_per_week > 0:
            plan_map[(p.class_id, p.subject_id)] = {
                "hours": p.hours_per_week,
                "teacher_id": p.teacher_id
            }
    
    # Valid days and periods
    VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri"}
    
    # Track actual lesson counts
    actual_counts = {}  # (class_id, subject_id) -> count
    
    for l in schedule:
        # Check 1: Invalid day
        if l["day"] not in VALID_DAYS:
            violations.append(f"• Невірний день: {l['day']} (має бути Mon/Tue/Wed/Thu/Fri)")
        
        # Check 2: Invalid period
        if not (0 <= l["period"] <= 8):
            c_name = class_names.get(l["class_id"], l["class_id"])
            violations.append(f"• Клас {c_name} ({l['day']}): невірний період {l['period']} (має бути 0-8)")
        
        # Check 3: Unknown class
        if l["class_id"] not in class_names:
            violations.append(f"• Урок посилається на невідомий клас (ID: {l['class_id']})")
        
        # Check 4: Unknown subject
        if l["subject_id"] not in subject_names:
            c_name = class_names.get(l["class_id"], l["class_id"])
            violations.append(f"• Клас {c_name}: невідомий предмет (ID: {l['subject_id']})")
        
        # Check 5: Unknown teacher
        if l["teacher_id"] not in teacher_names:
            c_name = class_names.get(l["class_id"], l["class_id"])
            s_name = subject_names.get(l["subject_id"], l["subject_id"])
            violations.append(f"• Клас {c_name}, предмет {s_name}: невідомий вчитель (ID: {l['teacher_id']})")
        
        # Track lesson counts
        key = (l["class_id"], l["subject_id"])
        actual_counts[key] = actual_counts.get(key, 0) + 1
    
    # Check 6: Lesson count mismatches (too few or too many)
    all_keys = set(plan_map.keys()) | set(actual_counts.keys())
    missing_lessons = []  # (class, subject, missing_count, expected, actual)
    extra_lessons = []    # (class, subject, extra_count, expected, actual)
    
    for key in all_keys:
        c_id, s_id = key
        c_name = class_names.get(c_id, c_id)
        s_name = subject_names.get(s_id, s_id)
        
        expected = plan_map.get(key, {}).get("hours", 0)
        actual = actual_counts.get(key, 0)
        
        if actual < expected:
            missing_count = expected - actual
            missing_lessons.append((c_name, s_name, missing_count, expected, actual))
        elif actual > expected:
            extra_count = actual - expected
            extra_lessons.append((c_name, s_name, extra_count, expected, actual))
    
    # Sort by missing/extra count (biggest problems first)
    missing_lessons.sort(key=lambda x: x[2], reverse=True)
    extra_lessons.sort(key=lambda x: x[2], reverse=True)
    
    # Add formatted messages
    for c_name, s_name, missing, expected, actual in missing_lessons:
        if missing == 1:
            violations.append(f"• Неможливо додати 1 урок з '{s_name}' в клас {c_name} (заплановано {expected}, розміщено {actual})")
        else:
            violations.append(f"• Неможливо додати {missing} уроки з '{s_name}' в клас {c_name} (заплановано {expected}, розміщено {actual})")
    
    for c_name, s_name, extra, expected, actual in extra_lessons:
        if extra == 1:
            violations.append(f"• Зайвий 1 урок з '{s_name}' в класі {c_name} (заплановано {expected}, розміщено {actual})")
        else:
            violations.append(f"• Зайві {extra} уроки з '{s_name}' в класі {c_name} (заплановано {expected}, розміщено {actual})")
    
    # Add summary if there are missing lessons
    if missing_lessons:
        total_missing = sum(m[2] for m in missing_lessons)
        total_planned = sum(p.hours_per_week for p in data.plan if p.hours_per_week > 0)
        total_placed = len(schedule)
        violations.append(f"**Всього не розміщено: {total_missing} уроків з {total_planned} запланованих ({total_placed} розміщено)**")
    
    # Check 7: Wrong teacher assigned
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
    
    # Group by class and day for gap/start checks
    class_days = {}  # (class_id, day) -> [periods]
    for l in schedule:
        key = (l["class_id"], l["day"])
        if key not in class_days:
            class_days[key] = []
        class_days[key].append(l["period"])
    
    for (c_id, day), periods in class_days.items():
        periods.sort()
        if not periods:
            continue
        
        c_name = class_names.get(c_id, c_id)
        
        # Check 8: Start period
        if periods[0] > 1:
            violations.append(f"• {c_name} ({day}): починає з {periods[0]}-го уроку замість 1-го")
        
        # Check 9: Gaps
        for i in range(len(periods) - 1):
            if periods[i + 1] - periods[i] > 1:
                violations.append(f"• {c_name} ({day}): має вікно між {periods[i]} та {periods[i+1]} уроками")
    
    # Check 10: Teacher conflicts (same teacher, same time, different classes)
    teacher_slots = {}  # (teacher_id, day, period) -> [class_ids]
    for l in schedule:
        key = (l["teacher_id"], l["day"], l["period"])
        if key not in teacher_slots:
            teacher_slots[key] = []
        teacher_slots[key].append(l["class_id"])
    
    for (t_id, day, period), class_ids in teacher_slots.items():
        if len(class_ids) > 1:
            t_name = teacher_names.get(t_id, t_id)
            class_list = ", ".join([class_names.get(c, c) for c in class_ids])
            violations.append(f"• Вчитель {t_name} ({day}, урок {period}): одночасно в класах {class_list}")
    
    # Check 11: Class conflicts (same class, same time, different subjects/teachers)
    class_slots = {}  # (class_id, day, period) -> [lesson_info]
    for l in schedule:
        key = (l["class_id"], l["day"], l["period"])
        if key not in class_slots:
            class_slots[key] = []
        class_slots[key].append({
            "subject": subject_names.get(l["subject_id"], l["subject_id"]),
            "teacher": teacher_names.get(l["teacher_id"], l["teacher_id"])
        })
    
    for (c_id, day, period), lessons in class_slots.items():
        if len(lessons) > 1:
            c_name = class_names.get(c_id, c_id)
            lesson_list = ", ".join([f"{l['subject']} ({l['teacher']})" for l in lessons])
            violations.append(f"• Клас {c_name} ({day}, урок {period}): одночасно {lesson_list}")
    
    # Check 12: Daily lesson limits (max 8)
    class_daily_counts = {}  # (class_id, day) -> count
    for l in schedule:
        key = (l["class_id"], l["day"])
        class_daily_counts[key] = class_daily_counts.get(key, 0) + 1
    
    for (c_id, day), count in class_daily_counts.items():
        if count > 8:  # Absolute maximum
            c_name = class_names.get(c_id, c_id)
            violations.append(f"• Клас {c_name} ({day}): {count} уроків на день (максимум 8)")
    
    # Add helpful summary if there are violations
    if violations and missing_lessons:
        violations.append("")  # Empty line for separation
        violations.append("💡 **Порада**: Якщо уроки не вдалося розмістити, спробуйте:")
        violations.append("   - Зменшити кількість годин на тиждень для деяких предметів")
        violations.append("   - Перевірити, чи не перевантажені вчителі")
        violations.append("   - Переконатися, що всі класи мають достатньо вільних слотів")
    
    return violations

def can_move_lesson(lesson: Dict[str, Any], target_period: int, schedule: List[Dict[str, Any]]) -> bool:
    """Check if lesson can be moved to target period without conflicts"""
    
    # Check teacher conflict - is teacher free at target time?
    for other in schedule:
        if other == lesson:
            continue
        if (other["teacher_id"] == lesson["teacher_id"] and 
            other["day"] == lesson["day"] and 
            other["period"] == target_period):
            return False
    
    # Check class conflict - is class free at target time?
    for other in schedule:
        if other == lesson:
            continue
        if (other["class_id"] == lesson["class_id"] and 
            other["day"] == lesson["day"] and 
            other["period"] == target_period):
            return False
    
    return True

def optimize_period_zero(schedule: List[Dict[str, Any]], data: ScheduleRequest) -> List[Dict[str, Any]]:
    """Move lessons from period 0 to periods 1-7 when possible without conflicts"""
    
    if not schedule:
        return schedule
    
    # Build teacher preference lookup
    teacher_prefers_zero = {t.id: t.prefers_period_zero for t in data.teachers}
    
    # Find all period 0 lessons
    period_zero_lessons = [l for l in schedule if l["period"] == 0]
    
    if not period_zero_lessons:
        return schedule  # Nothing to optimize
    
    moved_count = 0
    skipped_count = 0
    
    # Try to move each period 0 lesson
    for lesson in period_zero_lessons:
        teacher_id = lesson["teacher_id"]
        
        # Don't move if teacher prefers period 0
        if teacher_prefers_zero.get(teacher_id, False):
            skipped_count += 1
            continue
        
        # Try periods 1-7 in order (prefer earlier periods)
        for target_period in range(1, 8):
            if can_move_lesson(lesson, target_period, schedule):
                # Move the lesson
                lesson["period"] = target_period
                moved_count += 1
                break  # Found a slot, move to next lesson
    
    if moved_count > 0:
        print(f"Optimization: moved {moved_count} lessons from period 0 to periods 1-7")
    if skipped_count > 0:
        print(f"Optimization: kept {skipped_count} lessons in period 0 (teacher preference)")
    
    return schedule


def ortools_solve(data: ScheduleRequest, periods: List[int], strict: bool = True) -> tuple[Optional[List[Dict[str, Any]]], str]:
    model = cp_model.CpModel()
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    
    # --- 1. PREPARE DATA ---
    teacher_names = {t.id: t.name for t in data.teachers}
    class_names = {c.id: c.name for c in data.classes}
    teacher_prefers_zero = {t.id: t.prefers_period_zero for t in data.teachers}
    teacher_availabilities = {t.id: t.availability or {} for t in data.teachers}
    
    # data_requests equivalents
    requests = []
    
    def is_primary(c_name: str) -> bool:
        import re
        match = re.match(r'^(\d+)', c_name)
        if match:
            grade = int(match.group(1))
            return grade < 5
        return False

    for plan in data.plan:
        if plan.hours_per_week > 0:
            c_name = class_names.get(plan.class_id, "")
            if is_primary(c_name): continue
                
            requests.append({
                "class_id": plan.class_id,
                "teacher_id": plan.teacher_id,
                "subject_id": plan.subject_id,
                "count": plan.hours_per_week
            })

    classes = [c.id for c in data.classes]
    teachers = [t.id for t in data.teachers]
    
    # --- 2. VARIABLES ---
    # x[(r_idx, d, p)] = 1 if request r_idx is scheduled at day d, period p
    x = {}
    class_busy = {}
    teacher_busy = {}

    for c in classes:
        for d in range(len(days)):
            for p in periods:
                class_busy[(c, d, p)] = model.NewBoolVar(f'c_busy_{c}_{d}_{p}')

    for t in teachers:
        for d in range(len(days)):
            for p in periods:
                teacher_busy[(t, d, p)] = model.NewBoolVar(f't_busy_{t}_{d}_{p}')

    for r_idx, req in enumerate(requests):
        for d in range(len(days)):
            for p in periods:
                x[(r_idx, d, p)] = model.NewBoolVar(f'lesson_{r_idx}_{d}_{p}')
                model.AddImplication(x[(r_idx, d, p)], class_busy[(req["class_id"], d, p)])
                model.AddImplication(x[(r_idx, d, p)], teacher_busy[(req["teacher_id"], d, p)])
                
                # Availability Constraint: If teacher is blocked, lesson cannot be here
                teacher_id = req["teacher_id"]
                day_name = days[d]
                blocked_periods = teacher_availabilities.get(teacher_id, {}).get(day_name, [])
                if p in blocked_periods:
                    model.Add(x[(r_idx, d, p)] == 0)

    # --- 3. HARD CONSTRAINTS ---

    # A. Exactly 'count' hours per week for each request
    for r_idx, req in enumerate(requests):
        model.Add(sum(x[(r_idx, d, p)] for d in range(len(days)) for p in periods) == req["count"])

    # B. At most one lesson per slot for each teacher
    for t in teachers:
        for d in range(len(days)):
            for p in periods:
                relevant_vars = [x[(r_idx, d, p)] for r_idx, req in enumerate(requests) if req["teacher_id"] == t]
                if relevant_vars:
                    model.Add(sum(relevant_vars) <= 1)
                    model.Add(teacher_busy[(t, d, p)] == sum(relevant_vars))

    # C. At most one lesson per slot for each class
    for c in classes:
        for d in range(len(days)):
            for p in periods:
                relevant_vars = [x[(r_idx, d, p)] for r_idx, req in enumerate(requests) if req["class_id"] == c]
                if relevant_vars:
                    model.Add(sum(relevant_vars) <= 1)
                    model.Add(class_busy[(c, d, p)] == sum(relevant_vars))

    # --- 4. OPTIMIZATION OBJECTIVES & ADDITIONAL CONSTRAINTS ---
    objective_terms = []

    for c in classes:
        for d in range(len(days)):
            day_load = sum(class_busy[(c, d, p)] for p in periods)
            
            # Max daily load constraint (dynamic based on available periods)
            model.Add(day_load <= len(periods))

            has_lessons = model.NewBoolVar(f'has_lessons_{c}_{d}')
            model.Add(day_load > 0).OnlyEnforceIf(has_lessons)
            model.Add(day_load == 0).OnlyEnforceIf(has_lessons.Not())

            start_p = model.NewIntVar(min(periods), max(periods), f'start_{c}_{d}')
            end_p = model.NewIntVar(min(periods), max(periods), f'end_{c}_{d}')
            
            for p in periods:
                model.Add(start_p <= p).OnlyEnforceIf(class_busy[(c, d, p)])
                model.Add(end_p >= p).OnlyEnforceIf(class_busy[(c, d, p)])
            
            # --- STRICT VS RELAXED LOGIC ---
            
            if strict:
                # 1. MUST start at 1
                if 1 in periods:
                    model.Add(start_p == 1).OnlyEnforceIf(has_lessons)
                
                # 2. MUST have NO GAPS
                # end - start + 1 == load
                model.Add(end_p - start_p + 1 == day_load).OnlyEnforceIf(has_lessons)
                
            else:
                # Relaxed Mode: Penalize bad starts and gaps
                
                # Penalty 1: Start > 1
                # (start_p - 1) * weight
                if 1 in periods:
                    objective_terms.append((start_p - 1) * 1000)
                
                # Penalty 2: Gaps
                # gaps = (end - start + 1) - load
                gaps = model.NewIntVar(0, 8, f'gaps_{c}_{d}')
                model.Add(gaps == (end_p - start_p + 1) - day_load).OnlyEnforceIf(has_lessons)
                model.Add(gaps == 0).OnlyEnforceIf(has_lessons.Not())
                objective_terms.append(gaps * 5000)

            # Common Objectives (Balance & Compactness)
            over_load = model.NewIntVar(0, 7, f'over_load_{c}_{d}')
            model.Add(over_load >= day_load - 5)
            objective_terms.append(over_load * 50)


    # Minimize Teacher Gaps (Always Soft)
    weight_teacher_gap = 10 
    for t in teachers:
        for d in range(len(days)):
            t_load = sum(teacher_busy[(t, d, p)] for p in periods)
            t_has_lessons = model.NewBoolVar(f't_has_{t}_{d}')
            model.Add(t_load > 0).OnlyEnforceIf(t_has_lessons)
            model.Add(t_load == 0).OnlyEnforceIf(t_has_lessons.Not())

            t_start = model.NewIntVar(min(periods), max(periods), f't_start_{t}_{d}')
            t_end = model.NewIntVar(min(periods), max(periods), f't_end_{t}_{d}')
            
            for p in periods:
                model.Add(t_start <= p).OnlyEnforceIf(teacher_busy[(t, d, p)])
                model.Add(t_end >= p).OnlyEnforceIf(teacher_busy[(t, d, p)])
            
            span = model.NewIntVar(0, max(periods), f't_span_{t}_{d}')
            model.Add(span == t_end - t_start).OnlyEnforceIf(t_has_lessons)
            model.Add(span == 0).OnlyEnforceIf(t_has_lessons.Not())
            
            gap_count = model.NewIntVar(0, max(periods), f't_gaps_{t}_{d}')
            model.Add(gap_count == span - t_load + 1).OnlyEnforceIf(t_has_lessons)
            model.Add(gap_count == 0).OnlyEnforceIf(t_has_lessons.Not())
            
            objective_terms.append(gap_count * weight_teacher_gap)

    # --- FINAL PUSH (Global Preferences) ---
    for r_idx, req in enumerate(requests):
        for d in range(len(days)):
            for p in periods:
                # Prefer earlier slots mildly
                objective_terms.append(x[(r_idx, d, p)] * p)
    
    # Penalty/Bonus for using period 0 based on teacher preference
    if 0 in periods:
        for r_idx, req in enumerate(requests):
            teacher_id = req["teacher_id"]
            prefers_zero = teacher_prefers_zero.get(teacher_id, False)
            
            for d in range(len(days)):
                if (r_idx, d, 0) in x:
                    if prefers_zero:
                        # Bonus for teachers who prefer early morning
                        objective_terms.append(x[(r_idx, d, 0)] * (-5000))
                    else:
                        # Penalty for teachers who don't prefer early morning
                        objective_terms.append(x[(r_idx, d, 0)] * 10000)

    model.Minimize(sum(objective_terms))

    # --- 5. SOLVE ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0 if strict else 30.0
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        schedule = []
        for r_idx, req in enumerate(requests):
            for d in range(len(days)):
                for p in periods:
                    if solver.Value(x[(r_idx, d, p)]):
                        schedule.append({
                            "class_id": req["class_id"],
                            "subject_id": req["subject_id"],
                            "teacher_id": req["teacher_id"],
                            "day": days[d],
                            "period": p
                        })
        return schedule, ""
    else:
        return None, "Неможливо знайти рішення."

def has_gaps(mask: int, max_period: int) -> int:
    """
    Returns the number of gaps in a daily schedule mask.
    A mask is an integer where bit N is set if period N is occupied.
    Example: 10100 (binary) -> periods 2 and 4 occupied. Gap at 3.
    """
    if mask == 0:
        return 0
    
    # Find range of set bits
    first = 0
    while not (mask & (1 << first)):
        first += 1
    
    last = max_period
    while not (mask & (1 << last)) and last >= first:
        last -= 1
        
    if first >= last:
        return 0
        
    # Count zeros between first and last
    gaps = 0
    for i in range(first, last + 1):
        if not (mask & (1 << i)):
            gaps += 1
    return gaps

def count_set_bits(n):
    return bin(n).count('1')

def weighted_score_solve(data: ScheduleRequest, periods: List[int], steps: int) -> tuple[Optional[List[Dict[str, Any]]], str]:
    start_time = time.time()
    max_duration = 5.0 # Timelimit reduced to prevent hanging
    
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    day_map = {d: i for i, d in enumerate(days)}
    
    # Weights
    W_CONFLICT = 10000    # Hard constraint: Teacher double booking
    W_STUDENT_GAP = 5000  # Hard constraint: Student gaps (Must be essentially forbidden)
    W_TEACHER_GAP = 10    # Soft constraint: Teacher gaps (Minimize if possible)
    
    # Prepare lessons
    lessons = []
    teacher_hours = {}
    class_plans = {}
    
    teacher_names = {t.id: t.name for t in data.teachers}
    class_names = {c.id: c.name for c in data.classes}
    
    # --- Data Loading ---
    for plan in data.plan:
        if plan.teacher_id not in teacher_names or plan.class_id not in class_names:
            continue
            
        t_id = plan.teacher_id
        c_id = plan.class_id
        
        teacher_hours[t_id] = teacher_hours.get(t_id, 0) + plan.hours_per_week
        if c_id not in class_plans:
            class_plans[c_id] = []
            
        for _ in range(plan.hours_per_week):
            lesson = {
                "id": len(lessons),
                "class_id": c_id,
                "subject_id": plan.subject_id,
                "teacher_id": t_id,
                # State
                "day_idx": -1,
                "period": -1
            }
            lessons.append(lesson)
            class_plans[c_id].append(lesson)

    # --- Initial Random Assignment (Valid Periods/Days) ---
    # We assign ensuring classes don't have double-bookings (trivial hard constraint)
    # Strategy: For each class, pick N random unique (day, period) slots
    
    all_slots = [(d, p) for d in range(5) for p in periods]
    num_slots = len(all_slots)
    
    # Bitmask states
    # teacher_masks[teacher_id][day_idx] = bitmask
    teacher_masks = {t_id: [0]*5 for t_id in teacher_names}
    # class_masks[class_id][day_idx] = bitmask
    class_masks = {c_id: [0]*5 for c_id in class_names}
    
    # Helper to update mask
    def toggle_mask(masks, entity_id, day_idx, period):
        masks[entity_id][day_idx] ^= (1 << period)

    # Sanity checks
    for c_id, c_lessons in class_plans.items():
        if len(c_lessons) > num_slots:
             return None, f"Клас {class_names[c_id]} має забагато уроків."

    # Initialization
    teacher_overlap_counts = {} # (t_id, day_idx, period) -> count
    
    for c_id, c_lessons in class_plans.items():
        chosen_slots = random.sample(all_slots, len(c_lessons))
        for i, (day_idx, period) in enumerate(chosen_slots):
            l = c_lessons[i]
            l["day_idx"] = day_idx
            l["period"] = period
            
            toggle_mask(class_masks, c_id, day_idx, period)
            toggle_mask(teacher_masks, l["teacher_id"], day_idx, period)
            
            key = (l["teacher_id"], day_idx, period)
            teacher_overlap_counts[key] = teacher_overlap_counts.get(key, 0) + 1

    # --- Score Calculation Helper ---
    def calculate_total_score():
        score = 0
        
        # 1. Teacher Conflicts
        for count in teacher_overlap_counts.values():
            if count > 1:
                score += (count - 1) * W_CONFLICT
        
        # 2. Student Gaps
        for c_id in class_masks:
            for d in range(5):
                score += has_gaps(class_masks[c_id][d], 8) * W_STUDENT_GAP
                
        # 3. Teacher Gaps
        for t_id in teacher_masks:
            for d in range(5):
                score += has_gaps(teacher_masks[t_id][d], 8) * W_TEACHER_GAP
                
        return score

    current_score = calculate_total_score()
    
    # --- Local Search ---
    
    # We only move lessons within the valid slots for that class (swapping or moving to empty)
    # To simplify, we pick a random lesson and try to move it to a different slot valid for its class.
    # Because we initialized classes with unique slots, we maintain "Class Collision Free" property 
    # by only SWAPPING two lessons of the same class or moving to an empty slot of that class.
    # Actually, simplistic approach: Move lesson to an empty slot of the SAME class.
    
    max_period = max(periods)
    
    for step in range(steps):
        if current_score == 0:
            break # Perfect solution found
            
        # Optimization: If only teacher gaps remain, strict score might be acceptable low
        # But we want strict 0 for conflicts and student gaps.
        # "Acceptable" if score < W_STUDENT_GAP (meaning 0 conflicts, 0 student gaps, only teacher gaps)
        # However, checking strictly 0 conflicts is safer.
        
        # Check hard constraints satisfaction
        hard_violations = 0
        for count in teacher_overlap_counts.values(): 
            if count > 1: hard_violations += 1
        
        student_gap_violations = 0
        for c_id in class_masks:
            for d in range(5):
                if has_gaps(class_masks[c_id][d], 8): student_gap_violations += 1

        if hard_violations == 0 and student_gap_violations == 0:
            # Only teacher gaps left, which is acceptable
            break

        if step % 2000 == 0 and (time.time() - start_time) > max_duration:
            print(f"Timeout at step {step}. Score: {current_score}")
            break

        # --- Move Strategy ---
        # 1. Pick a random lesson
        # Heuristic: Pick a lesson involved in a conflict or a class with gaps?
        # Random choice is robust enough usually.
        l_idx = random.randrange(len(lessons))
        lesson = lessons[l_idx]
        
        c_id = lesson["class_id"]
        t_id = lesson["teacher_id"]
        old_day = lesson["day_idx"]
        old_period = lesson["period"]
        
        # Find available slots for this class (slots currently NOT occupied by this class)
        # Re-calculating expensive?
        # Let's try 1 random proposed move instead of exhaustive search to be fast
        
        # Try to move to a random empty slot for this class
        # OR swap with another lesson of this class
        
        is_swap = random.random() < 0.3
        
        if is_swap and len(class_plans[c_id]) > 1:
            # Swap with another lesson of same class
            other = random.choice(class_plans[c_id])
            if other == lesson: continue
            
            new_day = other["day_idx"]
            new_period = other["period"]
            
            # Undo Old
            toggle_mask(teacher_masks, t_id, old_day, old_period)
            toggle_mask(teacher_masks, other["teacher_id"], new_day, new_period)
            teacher_overlap_counts[(t_id, old_day, old_period)] -= 1
            teacher_overlap_counts[(other["teacher_id"], new_day, new_period)] -= 1
            
            # Apply New
            # lesson -> new_pos, other -> old_pos
            toggle_mask(teacher_masks, t_id, new_day, new_period)
            toggle_mask(teacher_masks, other["teacher_id"], old_day, old_period)
            teacher_overlap_counts[(t_id, new_day, new_period)] = teacher_overlap_counts.get((t_id, new_day, new_period), 0) + 1
            teacher_overlap_counts[(other["teacher_id"], old_day, old_period)] = teacher_overlap_counts.get((other["teacher_id"], old_day, old_period), 0) + 1
            
            # Class masks don't change in a swap!
            
            # Recalculate Logic
            # Optimization: Delta score calculation is complex, let's just calc full score for now (slow but safe)
            # Or better: Delta calculation
            
            # We don't really support delta calculation easy here without refactoring.
            # Let's revert if score didn't improve or with a simulated annealing probability?
            # Basic Hill Climbing for now.
            
            new_score = calculate_total_score()
            if new_score <= current_score:
                current_score = new_score
                # Commit (Update objects)
                lesson["day_idx"] = new_day
                lesson["period"] = new_period
                other["day_idx"] = old_day
                other["period"] = old_period
            else:
                # Revert
                teacher_overlap_counts[(t_id, new_day, new_period)] -= 1
                teacher_overlap_counts[(other["teacher_id"], old_day, old_period)] -= 1
                toggle_mask(teacher_masks, t_id, new_day, new_period)
                toggle_mask(teacher_masks, other["teacher_id"], old_day, old_period)
                
                teacher_overlap_counts[(t_id, old_day, old_period)] += 1
                teacher_overlap_counts[(other["teacher_id"], new_day, new_period)] += 1
                toggle_mask(teacher_masks, t_id, old_day, old_period)
                toggle_mask(teacher_masks, other["teacher_id"], new_day, new_period)

        else:
            # Move to empty slot
            # Find an empty slot for this class
            # class_masks[c_id]
            
            # Try 5 random attempts to find an empty slot
            found_slot = None
            for _ in range(5):
                rd = random.randrange(5)
                rp = random.choice(periods)
                if not (class_masks[c_id][rd] & (1 << rp)):
                    found_slot = (rd, rp)
                    break
            
            if not found_slot: continue
            
            new_day, new_period = found_slot
            
            # Undo Old
            toggle_mask(class_masks, c_id, old_day, old_period)
            toggle_mask(teacher_masks, t_id, old_day, old_period)
            teacher_overlap_counts[(t_id, old_day, old_period)] -= 1
            
            # Apply New
            toggle_mask(class_masks, c_id, new_day, new_period)
            toggle_mask(teacher_masks, t_id, new_day, new_period)
            teacher_overlap_counts[(t_id, new_day, new_period)] = teacher_overlap_counts.get((t_id, new_day, new_period), 0) + 1
            
            new_score = calculate_total_score()
            
            if new_score <= current_score:
                current_score = new_score
                lesson["day_idx"] = new_day
                lesson["period"] = new_period
            else:
                # Revert
                teacher_overlap_counts[(t_id, new_day, new_period)] -= 1
                toggle_mask(teacher_masks, t_id, new_day, new_period)
                toggle_mask(class_masks, c_id, new_day, new_period)
                
                teacher_overlap_counts[(t_id, old_day, old_period)] += 1
                toggle_mask(teacher_masks, t_id, old_day, old_period)
                toggle_mask(class_masks, c_id, old_day, old_period)

    # Final result construction
    final_schedule = []
    for l in lessons:
        final_schedule.append({
            "class_id": l["class_id"],
            "subject_id": l["subject_id"],
            "teacher_id": l["teacher_id"],
            "day": days[l["day_idx"]],
            "period": l["period"]
        })
        
    # Check if we satisfied hard constraints
    hard_violations = 0
    conflict_details = []
    
    # Analyze conflicts
    # teacher_overlap_counts keys are (t_id, day_idx, period)
    for (t_id, day_idx, period), count in teacher_overlap_counts.items():
        if count > 1:
            hard_violations += 1
            t_name = teacher_names.get(t_id, t_id)
            day_name = days[day_idx]
            conflict_details.append(f"• Вчитель {t_name} має накладку: {day_name}, урок {period}")

    student_gap_violations = 0
    gap_details = []
    for c_id in class_masks:
        for d in range(5):
             if has_gaps(class_masks[c_id][d], 8): 
                 student_gap_violations += 1
                 c_name = class_names.get(c_id, c_id)
                 day_name = days[d]
                 gap_details.append(f"• Клас {c_name} має вікно: {day_name}")
                 
    if hard_violations > 0 or student_gap_violations > 0:
        error_msg = "Неможливо створити ідеальний розклад:\n"
        if hard_violations > 0:
            error_msg += f"\nКОНФЛІКТИ ВЧИТЕЛІВ ({hard_violations}):\n" + "\n".join(conflict_details[:10])
            if len(conflict_details) > 10: error_msg += f"\n...та ще {len(conflict_details) - 10}"
            error_msg += "\n"
            
        if student_gap_violations > 0:
            error_msg += f"\nВІКНА У КЛАСАХ ({student_gap_violations}):\n" + "\n".join(gap_details[:10])
            if len(gap_details) > 10: error_msg += f"\n...та ще {len(gap_details) - 10}"
        
        return None, error_msg
        
    return final_schedule, ""

