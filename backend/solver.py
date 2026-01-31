from typing import List, Dict, Any
from models import ScheduleRequest
from logic.preprocessor import validate_workloads
from logic.analyzer import analyze_violations
from logic.engine import ortools_solve, optimize_period_zero
from logic.genetic_solver import GeneticSolver

from logic.pulp_solver.core import solve_with_pulp

def generate_schedule(data: ScheduleRequest) -> Dict[str, Any]:
    # Pass 0: Pre-validation
    validation_errors = validate_workloads(data)
    if validation_errors:
        return {"status": "error", "message": "Помилка валідації:\n" + "\n".join(validation_errors)}

    # Strategy: Genetic (Evolutionary)
    if data.strategy == "genetic":
        # Optimized for laptop: Pop=8, Gen=3
        print(f"🧬 Using Genetic Solver (Pop=8, Gen=3)...")
        genetic = GeneticSolver(data, population_size=8, generations=3, mutation_rate=0.4)
        result = genetic.evolve()
        
        if result:
            violations = analyze_violations(result, data)
            if not violations: return {"status": "success", "schedule": result}
            return {"status": "conflict", "schedule": result, "violations": violations}
        else:
            return {"status": "error", "message": "Генетичний алгоритм не зміг знайти валідне рішення."}

    # Dispatch based on strategy
    if data.strategy == "pulp":
        print(f"Using PuLP Solver with timeout {data.timeout}s...")
        timeout_seconds = data.timeout if data.timeout else 30
        result, error = solve_with_pulp(data, list(range(1, 8)), strict=True, timeout=timeout_seconds)
        # Note: PuLP simple implementation doesn't have "diagnostic" passes yet in this iteration
        # simple failover or return
        if result:
             # Basic violation check (reusing existing analyzer)
            violations = analyze_violations(result, data)
            if not violations: return {"status": "success", "schedule": result}
            return {"status": "conflict", "schedule": result, "violations": violations}
        else:
             return {"status": "error", "message": f"PuLP Solver failed: {error}"}

    # Default: OR-Tools (Logic preserved)
    # Pass 1: Strict Solve (Periods 1-7)
    print("Attempting STRICT solve (1-7)...")
    result, error = ortools_solve(data, list(range(1, 8)), strict=True)
    if result:
        violations = analyze_violations(result, data)
        if not violations: return {"status": "success", "schedule": result}
        return {"status": "conflict", "schedule": result, "violations": violations}
    
    # Pass 2: Diagnostic Solve (Periods 1-7)
    print("Strict solve failed. Attempting DIAGNOSTIC solve (1-7)...")
    result, error = ortools_solve(data, list(range(1, 8)), strict=False)
    if result:
        result = optimize_period_zero(result, data)
        violations = analyze_violations(result, data)
        return {
            "status": "conflict", 
            "schedule": result, 
            "violations": violations or ["• Solver не зміг знайти ідеальне рішення, спробуйте зменшити навантаження."]
        }
    
    # Pass 3: Emergency Solve (Periods 0-7)
    print("Diagnostic 1-7 failed. Attempting EMERGENCY solve (0-7)...")
    result, error = ortools_solve(data, list(range(0, 8)), strict=False)
    if result:
        result = optimize_period_zero(result, data)
        violations = analyze_violations(result, data)
        return {
            "status": "conflict",
            "schedule": result,
            "violations": violations or ["• Використано нульовий урок для розміщення всіх уроків."]
        }

    return {"status": "error", "message": "Помилка генерації. Навіть частковий розклад неможливий."}
