import random
import time
from typing import List, Dict, Any, Optional, Tuple
from ortools.sat.python import cp_model
from models import ScheduleRequest
from .constraints import has_gaps, can_move_lesson

def optimize_period_zero(schedule: List[Dict[str, Any]], data: ScheduleRequest) -> List[Dict[str, Any]]:
    if not schedule: return schedule
    teacher_prefers_zero = {t.id: t.prefers_period_zero for t in data.teachers}
    period_zero_lessons = [l for l in schedule if l["period"] == 0]
    for lesson in period_zero_lessons:
        if teacher_prefers_zero.get(lesson["teacher_id"], False): continue
        for target_period in range(1, 8):
            if can_move_lesson(lesson, target_period, schedule):
                lesson["period"] = target_period
                break
    return schedule

def ortools_solve(data: ScheduleRequest, periods: List[int], strict: bool = True, fixed_assignments: List[Dict[str, Any]] = None) -> Tuple[Optional[List[Dict[str, Any]]], str]:
    model = cp_model.CpModel()
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    day_map = {d: i for i, d in enumerate(days)}
    class_names = {c.id: c.name for c in data.classes}
    teacher_availabilities = {t.id: t.availability or {} for t in data.teachers}
    teacher_prefers_zero = {t.id: t.prefers_period_zero for t in data.teachers}
    
    requests = []
    
    def check_is_primary(name: str) -> bool:
        import re
        match = re.match(r'^(\d+)', name)
        if match:
            return int(match.group(1)) < 5
        return False

    for plan in data.plan:
        if plan.hours_per_week > 0:
            c_name = class_names.get(plan.class_id, "")
            if check_is_primary(c_name): continue
            requests.append({"class_id": plan.class_id, "teacher_id": plan.teacher_id, "subject_id": plan.subject_id, "count": plan.hours_per_week})

    x, class_busy, teacher_busy = {}, {}, {}
    for c in [c.id for c in data.classes]:
        for d in range(5):
            for p in periods: class_busy[(c, d, p)] = model.NewBoolVar(f'c_busy_{c}_{d}_{p}')
    for t in [t.id for t in data.teachers]:
        for d in range(5):
            for p in periods: teacher_busy[(t, d, p)] = model.NewBoolVar(f't_busy_{t}_{d}_{p}')

    for r_idx, req in enumerate(requests):
        for d in range(5):
            for p in periods:
                x[(r_idx, d, p)] = model.NewBoolVar(f'lesson_{r_idx}_{d}_{p}')
                model.AddImplication(x[(r_idx, d, p)], class_busy[(req["class_id"], d, p)])
                model.AddImplication(x[(r_idx, d, p)], teacher_busy[(req["teacher_id"], d, p)])
                if p in teacher_availabilities.get(req["teacher_id"], {}).get(days[d], []): model.Add(x[(r_idx, d, p)] == 0)
        model.Add(sum(x[(r_idx, d, p)] for d in range(5) for p in periods) == req["count"])

    # Enforce fixed assignments (for mutation/repair)
    if fixed_assignments:
        # Group fixed assignments by (class, subject, teacher) to handle multiples
        from collections import defaultdict
        fixed_map = defaultdict(list)
        for f in fixed_assignments:
            key = (f["class_id"], f["subject_id"], f["teacher_id"])
            if f["day"] in day_map:
                fixed_map[key].append((day_map[f["day"]], f["period"]))

        # For each request type, enforce that specific slots are taken
        for r_idx, req in enumerate(requests):
            key = (req["class_id"], req["subject_id"], req["teacher_id"])
            if key in fixed_map:
                # This is a bit complex: we have N requests for this key, and M fixed slots.
                # Simplification: if we have fixed slots for this type, enforce them.
                # But since all requests of same type are identical, any of them can fill the slot.
                # However, we simply need to ensure that *someone* fills these slots.
                # Actually, strictly enforcing x[r_idx, d, p] == 1 might conflict if multiple r_idx share same key.
                # Better approach: Pre-process constraints globally.
                pass 
        
        # Proper enforcement:
        # Iterate over all specific fixed slots (class, day, period) -> implies class_busy
        # We need to find *which* r_idx corresponds to that fixed slot.
        # Since r_idx are fungible for same (c, s, t), we can greedily assign them.
        
        assigned_indices = set()
        
        for f in fixed_assignments:
            if f["day"] not in day_map: continue
            d_idx = day_map[f["day"]]
            p_idx = f["period"]
            
            # Find a free Request that matches this assignment
            found = False
            for r_idx, req in enumerate(requests):
                if r_idx in assigned_indices: continue
                if (req["class_id"] == f["class_id"] and 
                    req["teacher_id"] == f["teacher_id"] and 
                    req["subject_id"] == f["subject_id"]):
                    
                    if (r_idx, d_idx, p_idx) in x:
                        model.Add(x[(r_idx, d_idx, p_idx)] == 1)
                        assigned_indices.add(r_idx)
                        found = True
                        break
            # If not found, it might be a conflict or invalid fix, strictly speaking we should ignore or log
    
    for t in [t.id for t in data.teachers]:
        for d in range(5):
            for p in periods:
                relevant = [x[(r_idx, d, p)] for r_idx, req in enumerate(requests) if req["teacher_id"] == t]
                if relevant:
                    model.Add(sum(relevant) <= 1)
                    model.Add(teacher_busy[(t, d, p)] == sum(relevant))

    for c in [c.id for c in data.classes]:
        for d in range(5):
            for p in periods:
                relevant = [x[(r_idx, d, p)] for r_idx, req in enumerate(requests) if req["class_id"] == c]
                if relevant:
                    model.Add(sum(relevant) <= 1)
                    model.Add(class_busy[(c, d, p)] == sum(relevant))

    objective_terms = []
    for c in [c.id for c in data.classes]:
        for d in range(5):
            day_load = sum(class_busy[(c, d, p)] for p in periods)
            has_lessons = model.NewBoolVar(f'has_lessons_{c}_{d}')
            model.Add(day_load > 0).OnlyEnforceIf(has_lessons)
            model.Add(day_load == 0).OnlyEnforceIf(has_lessons.Not())
            start_p, end_p = model.NewIntVar(min(periods), max(periods), f's_{c}_{d}'), model.NewIntVar(min(periods), max(periods), f'e_{c}_{d}')
            for p in periods:
                model.Add(start_p <= p).OnlyEnforceIf(class_busy[(c, d, p)])
                model.Add(end_p >= p).OnlyEnforceIf(class_busy[(c, d, p)])
            if strict:
                if 1 in periods: model.Add(start_p == 1).OnlyEnforceIf(has_lessons)
                model.Add(end_p - start_p + 1 == day_load).OnlyEnforceIf(has_lessons)
            else:
                if 1 in periods: objective_terms.append((start_p - 1) * 1000)
                gaps = model.NewIntVar(0, 8, f'g_{c}_{d}')
                model.Add(gaps == (end_p - start_p + 1) - day_load).OnlyEnforceIf(has_lessons)
                model.Add(gaps == 0).OnlyEnforceIf(has_lessons.Not())
                objective_terms.append(gaps * 5000)
    
    if 0 in periods:
        for r_idx, req in enumerate(requests):
            for d in range(5):
                if (r_idx, d, 0) in x:
                    objective_terms.append(x[(r_idx, d, 0)] * (-5000 if teacher_prefers_zero.get(req["teacher_id"], False) else 10000))

    model.Minimize(sum(objective_terms))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0 if strict else 30.0
    if solver.Solve(model) in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        res = []
        for r_idx, req in enumerate(requests):
            for d in range(5):
                for p in periods:
                    if solver.Value(x[(r_idx, d, p)]): res.append({"class_id": req["class_id"], "subject_id": req["subject_id"], "teacher_id": req["teacher_id"], "day": days[d], "period": p})
        return res, ""
    return None, "Неможливо знайти рішення."
