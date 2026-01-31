import random
import time
import copy
import os
from typing import List, Dict, Any, Tuple
from concurrent.futures import ProcessPoolExecutor, as_completed
from models import ScheduleRequest
from .engine import ortools_solve

def initial_population_worker(data: ScheduleRequest) -> List[Dict[str, Any]]:
    """
    Worker function to generate a single initial schedule.
    Tries strategies from strict to relaxed.
    """
    # 1. Try Strict (1-7)
    res, _ = ortools_solve(data, list(range(1, 8)), strict=True)
    if res: return res
    
    # 2. Try Relaxed (1-7) - allows gaps/windows
    res, _ = ortools_solve(data, list(range(1, 8)), strict=False)
    if res: return res
    
    # 3. Try Emergency (0-7) - allows period 0
    res, _ = ortools_solve(data, list(range(0, 8)), strict=False)
    return res


def mutate_schedule(data: ScheduleRequest, schedule: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    LNS (Large Neighborhood Search) Mutation (Standalone for pickling):
    1. Keep X% of the schedule fixed.
    2. Unassign the rest.
    3. Re-solve using OR-Tools to fill the gaps.
    """
    if not schedule: return None
    
    mutation_strength = random.uniform(0.1, 0.4) # Unassign 10-40% of lessons
    num_to_keep = int(len(schedule) * (1 - mutation_strength))
    
    # Randomly select lessons to keep (Fixed Assignments)
    if num_to_keep > 0:
        fixed_assignments = random.sample(schedule, num_to_keep)
    else:
        fixed_assignments = []
    
    # Re-solve with these fixed constraints
    # Try strict first
    new_schedule, _ = ortools_solve(data, list(range(1, 8)), strict=True, fixed_assignments=fixed_assignments)
    if new_schedule: return new_schedule
    
    # Try diagnostic (relaxed 1-7)
    new_schedule, _ = ortools_solve(data, list(range(1, 8)), strict=False, fixed_assignments=fixed_assignments)
    if new_schedule: return new_schedule

    # Try emergency (relaxed 0-7)
    new_schedule, _ = ortools_solve(data, list(range(0, 8)), strict=False, fixed_assignments=fixed_assignments)
    
    return new_schedule if new_schedule else schedule # Return original if mutation failed completely

class GeneticSolver:

    def __init__(self, data: ScheduleRequest, population_size: int = 6, generations: int = 3, mutation_rate: float = 0.5, progress_callback=None):
        self.data = data
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.best_solution = None
        self.best_score = float('-inf')
        self.progress_callback = progress_callback

    def calculate_fitness(self, schedule: List[Dict[str, Any]]) -> float:
        """
        Calculates a fitness score (higher is better).
        Penalizes:
        - Gaps/Windows for teachers (Heavy penalty)
        - Period 0 usage (Heavy penalty)
        - Uneven daily distribution
        """
        if not schedule: return float('-inf')
        
        score = 0.0
        
        # Pre-process for fast lookup
        teacher_slots = {}
        for l in schedule:
            t_key = (l["teacher_id"], l["day"])
            if t_key not in teacher_slots: teacher_slots[t_key] = []
            teacher_slots[t_key].append(l["period"])

        # 1. Teacher Gaps (Windows)
        for t_day, periods in teacher_slots.items():
            periods.sort()
            if not periods: continue
            
            # Check for gaps
            for i in range(len(periods) - 1):
                gap = periods[i+1] - periods[i] - 1
                if gap > 0:
                    score -= (gap * 50)  # Huge penalty for windows
            
            # Check for isolated lessons (optional)
            if len(periods) == 1:
                score -= 10

        # 2. Period 0 Usage
        period_zero_count = sum(1 for l in schedule if l["period"] == 0)
        if period_zero_count > 0:
            score -= (period_zero_count * 200) # Significant penalty to prefer 1-7 range

        return score



    def evolve(self) -> List[Dict[str, Any]]:
        print(f"🧬 Starting Genetic Evolution: Pop={self.population_size}, Gens={self.generations}")
        if self.progress_callback:
            self.progress_callback(5, "⚡ Ініціалізація популяції...")
        
        # 1. Initialize Population (Parallel)
        population = []
        is_windows = os.name == 'nt'
        # Limit concurrency on Windows/weak hardware to ensure responsiveness
        max_workers = min(6, os.cpu_count() or 4) if is_windows else None 

        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            # Launch N solvers with slightly different params (e.g. different implicit random seeds)
            futures = [executor.submit(initial_population_worker, self.data) for _ in range(self.population_size)]
            
            completed = 0
            for future in as_completed(futures):
                try:
                    sol = future.result()
                    if sol:
                        population.append(sol)
                    completed += 1
                    # Report progress during initial population generation (5% to 25%)
                    if self.progress_callback:
                        progress_val = 5 + int((completed / self.population_size) * 20)
                        self.progress_callback(progress_val, f"⚡ Генерація початкової популяції: {completed}/{self.population_size}")
                except Exception as e:
                    print(f"❌ Worker failed: {e}")
                    completed += 1
        
        if not population:
            print("❌ Initial population failed to generate any valid schedules.")
            return None

        # Sort by fitness
        population.sort(key=self.calculate_fitness, reverse=True)
        self.best_solution = population[0]
        self.best_score = self.calculate_fitness(self.best_solution)
        print(f"   Generation 0 Best Score: {self.best_score}")

        # 2. Evolution Loop
        for gen in range(self.generations):
            if self.progress_callback:
                # Progress from 25% to 90% during evolution
                progress_val = 25 + int((gen / self.generations) * 65)
                self.progress_callback(progress_val, f"🧬 Еволюція: Покоління {gen + 1}/{self.generations}...")
            # Elitism: keep top 2 strict copies
            next_gen = population[:2] if len(population) >= 2 else population[:]
            
            parents = population[:max(1, len(population)//2)] # Top 50%
            
            # Mutation / Breeding
            with ProcessPoolExecutor(max_workers=max_workers) as executor:
                future_to_parent = []
                # Fill the rest of population with mutations
                while len(next_gen) + len(future_to_parent) < self.population_size:
                    parent = random.choice(parents)
                    future_to_parent.append(executor.submit(mutate_schedule, self.data, parent))
                
                for future in as_completed(future_to_parent):
                    try:
                        child = future.result()
                        if child:
                            next_gen.append(child)
                    except Exception as e:
                        print(f"❌ Mutation failed: {e}")
            
            # Evaluate and Sort
            population = next_gen
            population.sort(key=self.calculate_fitness, reverse=True)
            
            if population:
                current_best_score = self.calculate_fitness(population[0])
                if current_best_score > self.best_score:
                    self.best_score = current_best_score
                    self.best_solution = population[0]
                    print(f"   Generation {gen+1} NEW Best Score: {self.best_score}")
                else:
                    print(f"   Generation {gen+1} Best Score: {current_best_score}")

        # Final progress update
        if self.progress_callback:
            self.progress_callback(95, "✅ Завершення обробки...")

        return self.best_solution
