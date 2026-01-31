
import sys
import os
import asyncio
from models import ScheduleRequest, Teacher, Subject, ClassGroup, TeachingPlanItem
from logic.genetic_solver import GeneticSolver

# Mock data needed for solver initialization
data = ScheduleRequest(
    teachers=[Teacher(id='t1', name='T1', subjects=['math'])],
    classes=[ClassGroup(id='c1', name='C1')],
    subjects=[Subject(id='math', name='Math')],
    plan=[TeachingPlanItem(class_id='c1', subject_id='math', teacher_id='t1', hours_per_week=5)],
    strategy="genetic",
    genetic_population_size=2,
    genetic_generations=1
)

def test_genetic():
    print("Testing GeneticSolver with local callback...")
    
    # Define a local function to simulate the unpicklable callback
    def local_progress_callback(progress, message):
        print(f"Progress Callback: {progress}% - {message}")

    try:
        # Pass the local callback
        solver = GeneticSolver(data, population_size=2, generations=1, progress_callback=local_progress_callback)
        result = solver.evolve()
        print("Success: Solver finished without pickling error.")
    except Exception as e:
        print(f"Failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Windows requires this guard
    test_genetic()
