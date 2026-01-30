import pulp
from typing import List, Dict, Any, Optional, Tuple
from models import ScheduleRequest

def solve_with_pulp(data: ScheduleRequest, periods: List[int], strict: bool = True, timeout: int = 30) -> Tuple[Optional[List[Dict[str, Any]]], str]:
    """
    Solves the scheduling problem using the PuLP library (MIP).
    
    Args:
        data: Schedule request with teachers, classes, subjects, and plan
        periods: List of available periods (e.g., [1,2,3,4,5,6,7])
        strict: If True, enforces stricter constraints
        timeout: Maximum time in seconds for solver to run
    """
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    day_indices = range(5)
    
    # 1. Prepare Data
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
            # Skip primary classes as per original logic if needed, 
            # though usually we want to schedule everyone. 
            # blindly following original engine.py logic:
            if check_is_primary(c_name): continue
            
            requests.append({
                "class_id": plan.class_id, 
                "teacher_id": plan.teacher_id, 
                "subject_id": plan.subject_id, 
                "count": plan.hours_per_week
            })

    if not requests:
        return [], "No lessons to schedule."

    # 2. Define Problem
    prob = pulp.LpProblem("SchoolSchedule", pulp.LpMinimize)

    # 3. Define Variables
    # x[r_idx, d, p] = 1 if request r is scheduled on day d, period p
    # We use a tuple key strategy
    x = {}
    
    possible_slots = []
    for r_idx, req in enumerate(requests):
        for d in day_indices:
            day_name = days[d]
            teacher_unavailable = teacher_availabilities.get(req["teacher_id"], {}).get(day_name, [])
            
            for p in periods:
                # Hard Constraint: Availability
                if p in teacher_unavailable:
                    continue
                
                x[(r_idx, d, p)] = pulp.LpVariable(f"x_{r_idx}_{d}_{p}", 0, 1, pulp.LpBinary)
                possible_slots.append((r_idx, d, p))

    # 4. Hard Constraints

    # C1. Plan Fulfillment: Each request must be scheduled exactly 'count' times
    for r_idx, req in enumerate(requests):
        prob += pulp.lpSum([x[(r_idx, d, p)] for d in day_indices for p in periods if (r_idx, d, p) in x]) == req["count"], f"Count_Req_{r_idx}"

    # C2. Teacher Conflict: A teacher can only teach 1 lesson at a time
    teacher_ids = set(t.id for t in data.teachers)
    for t_id in teacher_ids:
        # Get all request indices for this teacher
        t_req_indices = [i for i, r in enumerate(requests) if r["teacher_id"] == t_id]
        if not t_req_indices: continue
        
        for d in day_indices:
            for p in periods:
                # Sum of all lessons for this teacher at d,p <= 1
                vars_in_slot = [x[(r_idx, d, p)] for r_idx in t_req_indices if (r_idx, d, p) in x]
                if vars_in_slot:
                    prob += pulp.lpSum(vars_in_slot) <= 1, f"Teacher_{t_id}_{d}_{p}"

    # C3. Class Conflict: A class can only have 1 lesson at a time
    class_ids = set(c.id for c in data.classes)
    for c_id in class_ids:
        c_req_indices = [i for i, r in enumerate(requests) if r["class_id"] == c_id]
        if not c_req_indices: continue
        
        for d in day_indices:
            for p in periods:
                vars_in_slot = [x[(r_idx, d, p)] for r_idx in c_req_indices if (r_idx, d, p) in x]
                if vars_in_slot:
                     prob += pulp.lpSum(vars_in_slot) <= 1, f"Class_{c_id}_{d}_{p}"

    # C4. GAP MINIMIZATION (SIMPLIFIED) for Teachers
    # Instead of complex first/last tracking, use a simpler heuristic:
    # Penalize "spread" by encouraging consecutive period usage
    # This is softer and won't cause infeasibility
    
    teacher_period_usage = {}
    
    for t_id in teacher_ids:
        t_req_indices = [i for i, r in enumerate(requests) if r["teacher_id"] == t_id]
        if not t_req_indices:
            continue
        
        for d in day_indices:
            # For each period, track if teacher is active
            for p in periods:
                active_var = pulp.LpVariable(f"active_{t_id}_{d}_{p}", 0, 1, pulp.LpBinary)
                teacher_period_usage[(t_id, d, p)] = active_var
                
                # active = 1 if teacher has ANY lesson at this period
                lessons_at_p = [x[(r_idx, d, p)] for r_idx in t_req_indices if (r_idx, d, p) in x]
                
                if lessons_at_p:
                    prob += active_var >= pulp.lpSum(lessons_at_p), f"Active_{t_id}_{d}_{p}"
                    # Since we now enforce <= 1 lesson per teacher per slot, this max constraint is redundant but safe
                    # prob += active_var <= len(lessons_at_p) * pulp.lpSum(lessons_at_p), f"ActiveMax_{t_id}_{d}_{p}"


    # 5. Objective Function
    objective_terms = []
    
    # 5.1 Basic Period Penalties (compactness & period 0)
    for (r_idx, d, p), var in x.items():
        req = requests[r_idx]
        if p == 0:
            if teacher_prefers_zero.get(req["teacher_id"], False):
                objective_terms.append(-10 * var)
            else:
                objective_terms.append(1000 * var)
        weight = p * 10 
        objective_terms.append(weight * var)

    # C5. STUDENT GAPS (SOFT CONSTRAINT)
    # Ensure students have no gaps in their schedule for periods >= 1.
    main_periods = sorted([p for p in periods if p > 0])
    if main_periods:
        for c_id in class_ids:
            c_req_indices = [i for i, r in enumerate(requests) if r["class_id"] == c_id]
            if not c_req_indices: continue
            for d in day_indices:
                day_active_vars = {}
                for p in main_periods:
                    c_active_var = pulp.LpVariable(f"c_active_{c_id}_{d}_{p}", 0, 1, pulp.LpBinary)
                    day_active_vars[p] = c_active_var
                    lessons_at_p = [x[(r_idx, d, p)] for r_idx in c_req_indices if (r_idx, d, p) in x]
                    if lessons_at_p:
                         prob += c_active_var == pulp.lpSum(lessons_at_p), f"C_Active_{c_id}_{d}_{p}"
                    else:
                         prob += c_active_var == 0, f"C_Active_Zero_{c_id}_{d}_{p}"

                start_vars = []
                for i, p in enumerate(main_periods):
                    start_var = pulp.LpVariable(f"c_start_{c_id}_{d}_{p}", 0, 1, pulp.LpBinary)
                    start_vars.append(start_var)
                    current_active = day_active_vars[p]
                    if i == 0:
                        prob += start_var >= current_active, f"StartReq_{c_id}_{d}_{p}"
                    else:
                        prev_p = main_periods[i-1]
                        prev_active = day_active_vars[prev_p]
                        prob += start_var >= current_active - prev_active, f"StartReq_{c_id}_{d}_{p}"
                
                # SOFT CONSTRAINT: Minimize start blocks per day (Student Gaps)
                STUDENT_GAP_PENALTY = 10000
                excess_starts = pulp.LpVariable(f"c_excess_starts_{c_id}_{d}", 0)
                prob += excess_starts >= pulp.lpSum(start_vars) - 1, f"ExcessStarts_{c_id}_{d}"
                objective_terms.append(STUDENT_GAP_PENALTY * excess_starts)

    # GAP PENALTY for TEACHERS
    GAP_PENALTY = 300  
    for t_id in teacher_ids:
        t_req_indices = [i for i, r in enumerate(requests) if r["teacher_id"] == t_id]
        if not t_req_indices: continue
        for d in day_indices:
            for p in periods[:-2]:
                if p+2 not in periods: continue
                if (t_id, d, p) in teacher_period_usage and (t_id, d, p+1) in teacher_period_usage and (t_id, d, p+2) in teacher_period_usage:
                    gap_indicator = teacher_period_usage[(t_id, d, p)] + teacher_period_usage[(t_id, d, p+2)] - 2 * teacher_period_usage[(t_id, d, p+1)]
                    gap_var = pulp.LpVariable(f"gap_simple_{t_id}_{d}_{p}", 0)
                    prob += gap_var >= gap_indicator, f"GapSimple_{t_id}_{d}_{p}"
                    objective_terms.append(GAP_PENALTY * gap_var)

    # TEACHER COMPACTNESS (METHODOLOGICAL DAYS SUPPORT)
    DAYS_OFF_BONUS = 500
    for t_id in teacher_ids:
         t_req_indices = [i for i, r in enumerate(requests) if r["teacher_id"] == t_id]
         if not t_req_indices: continue
         total_load = sum(requests[r]["count"] for r in t_req_indices)
         if total_load < 30: 
             for d in day_indices:
                 day_used_var = pulp.LpVariable(f"t_day_used_{t_id}_{d}", 0, 1, pulp.LpBinary)
                 day_active_vars = []
                 for p in periods:
                     if (t_id, d, p) in teacher_period_usage:
                         day_active_vars.append(teacher_period_usage[(t_id, d, p)])
                 if day_active_vars:
                     prob += pulp.lpSum(day_active_vars) <= len(periods) * day_used_var, f"DayUsed_{t_id}_{d}"
                     objective_terms.append(DAYS_OFF_BONUS * day_used_var)


    # DAILY DISTRIBUTION BALANCE: Avoid concentrating subject lessons in few days
    # For each (subject, class) pair, penalize uneven distribution across weekdays
    DISTRIBUTION_PENALTY = 100
    
    from collections import defaultdict
    subject_class_pairs = defaultdict(list)
    for r_idx, req in enumerate(requests):
        subject_class_pairs[(req["subject_id"], req["class_id"])].append(r_idx)
    
    for (s_id, c_id), req_indices in subject_class_pairs.items():
        # Calculate total lessons for this subject+class
        total_lessons = sum(requests[r]["count"] for r in req_indices)
        ideal_per_day = total_lessons / 5.0  # 5 days
        
        for d in day_indices:
            # Count actual lessons on this day
            day_count_var = pulp.LpVariable(f"daycount_{s_id}_{c_id}_{d}", 0, total_lessons, pulp.LpInteger)
            
            actual_on_day = pulp.lpSum([x[(r_idx, d, p)] for r_idx in req_indices 
                                        for p in periods if (r_idx, d, p) in x])
            
            prob += day_count_var == actual_on_day, f"DayCount_{s_id}_{c_id}_{d}"
            
            # Deviation from ideal (use absolute value via two variables)
            pos_deviation = pulp.LpVariable(f"pos_dev_{s_id}_{c_id}_{d}", 0)
            neg_deviation = pulp.LpVariable(f"neg_dev_{s_id}_{c_id}_{d}", 0)
            
            prob += day_count_var - ideal_per_day == pos_deviation - neg_deviation, f"Deviation_{s_id}_{c_id}_{d}"
            
            # Penalize total deviation
            objective_terms.append(DISTRIBUTION_PENALTY * (pos_deviation + neg_deviation))
    
    # ====== SOFT CONSTRAINTS ======
    
    # SOFT 1: CONSECUTIVE LESSONS - Penalize 3+ consecutive lessons of same subject
    CONSECUTIVE_PENALTY = 200
    
    class_subject_reqs = defaultdict(lambda: defaultdict(list))
    for r_idx, req in enumerate(requests):
        class_subject_reqs[req["class_id"]][req["subject_id"]].append(r_idx)
    
    for c_id, subjects_dict in class_subject_reqs.items():
        for s_id, req_indices in subjects_dict.items():
            for d in day_indices:
                # Check consecutive periods (windows of 3)
                for p in periods[:-2]:  # Can't check last 2 periods for 3-consecutive
                    if p+2 not in periods:
                        continue
                    
                    # Count lessons in periods p, p+1, p+2
                    consecutive_sum = pulp.lpSum([x[(r_idx, d, pp)] 
                                                 for r_idx in req_indices 
                                                 for pp in [p, p+1, p+2]
                                                 if (r_idx, d, pp) in x])
                    
                    # If sum >= 3, we have 3 consecutive (bad)
                    # Penalty = 200 * (consecutive_sum - 2) if > 2, else 0
                    excess_consec = pulp.LpVariable(f"consec_{c_id}_{s_id}_{d}_{p}", 0)
                    prob += excess_consec >= consecutive_sum - 2, f"Consecutive_{c_id}_{s_id}_{d}_{p}"
                    
                    objective_terms.append(CONSECUTIVE_PENALTY * excess_consec)
    
    # SOFT 2: DAY OVERLOAD - Penalize classes with more than 7 lessons per day
    OVERLOAD_PENALTY = 300
    
    for c_id in class_ids:
        c_req_indices = [i for i, r in enumerate(requests) if r["class_id"] == c_id]
        if not c_req_indices:
            continue
        
        for d in day_indices:
            daily_total = pulp.lpSum([x[(r_idx, d, p)] 
                                     for r_idx in c_req_indices 
                                     for p in periods 
                                     if (r_idx, d, p) in x])
            
            # Penalty if > 7 lessons
            overload = pulp.LpVariable(f"overload_{c_id}_{d}", 0)
            prob += overload >= daily_total - 7, f"Overload_{c_id}_{d}"
            
            objective_terms.append(OVERLOAD_PENALTY * overload)
    
    # SOFT 3: PERIOD PREFERENCES - Hard subjects (Math, Physics, Chemistry, Biology) best at periods 2-4
    PREFERENCE_BONUS = 20
    PREFERENCE_PENALTY = 50
    
    # Map subject names
    subject_names = {s.id: s.name for s in data.subjects}
    HARD_SUBJECTS_KEYWORDS = ["Математика", "Фізика", "Хімія", "Біологія", "Алгебра", "Геометрія"]
    
    for r_idx, req in enumerate(requests):
        s_name = subject_names.get(req["subject_id"], "")
        is_hard_subject = any(keyword in s_name for keyword in HARD_SUBJECTS_KEYWORDS)
        
        if is_hard_subject:
            for d in day_indices:
                for p in periods:
                    if (r_idx, d, p) not in x:
                        continue
                    
                    var = x[(r_idx, d, p)]
                    
                    # Preferred periods: 2, 3, 4 (middle of day, good concentration)
                    if p in [2, 3, 4]:
                        objective_terms.append(-PREFERENCE_BONUS * var)  # Bonus (negative penalty)
                    # Bad periods: 1 (too early), 6, 7 (too late, tired)
                    elif p in [1, 6, 7]:
                        objective_terms.append(PREFERENCE_PENALTY * var)
                    # Period 0 already heavily penalized in main logic
                    # Period 5 is neutral

    prob += pulp.lpSum(objective_terms)

    # 6. Solve
    # Use CBC solver with user-specified timeout
    solver_list = pulp.listSolvers(onlyAvailable=True)
    print(f"Available PuLP Solvers: {solver_list}")
    print(f"Using timeout: {timeout}s")
    
    # Prefer CBC
    solver = pulp.PULP_CBC_CMD(timeLimit=timeout, msg=False)
    prob.solve(solver)

    # 7. Extract Results
    status = pulp.LpStatus[prob.status]
    print(f"PuLP Solution Status: {status}")

    if status in ["Optimal", "Feasible"]:
        res = []
        for (r_idx, d, p), var in x.items():
            if var.varValue and var.varValue > 0.5:
                req = requests[r_idx]
                res.append({
                    "class_id": req["class_id"], 
                    "subject_id": req["subject_id"], 
                    "teacher_id": req["teacher_id"], 
                    "day": days[d], 
                    "period": p
                })
        return res, ""
    
    return None, f"No solution found (Status: {status})"
