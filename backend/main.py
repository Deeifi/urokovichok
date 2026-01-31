from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List
from sqlalchemy.orm import Session
import json
import asyncio

from models import ScheduleRequest
from solver import generate_schedule
from database import SessionLocal, engine, Base, SubjectDB, TeacherDB, ClassGroupDB, ScheduleDB

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "School Scheduler API is running"}

@app.post("/api/generate")
def generate(request: ScheduleRequest, db: Session = Depends(get_db)):
    result = generate_schedule(request)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/api/generate-stream")
async def generate_stream(request: ScheduleRequest):
    # Capture the running loop to use in callbacks from other threads
    main_loop = asyncio.get_running_loop()

    async def event_generator():
        queue = asyncio.Queue()

        def progress_callback(progress, message):
            # Put progress data into the queue from a synchronous context
            # Use the captured main_loop to call safely from the solver thread
            main_loop.call_soon_threadsafe(queue.put_nowait, {"type": "progress", "progress": progress, "message": message})

        # Run generation in a separate thread to not block the event loop
        async def run_solver():
            try:
                # Use run_in_executor for blocking CPU bound task
                result = await main_loop.run_in_executor(None, generate_schedule, request, progress_callback)
                await queue.put({"type": "result", "data": result})
            except Exception as e:
                import traceback
                print(f"❌ Solver Error: {str(e)}")
                traceback.print_exc()
                await queue.put({"type": "error", "message": str(e)})

        solver_task = asyncio.create_task(run_solver())

        while True:
            item = await queue.get()
            yield f"data: {json.dumps(item)}\n\n"
            if item["type"] in ["result", "error"]:
                break
        
        await solver_task

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/data")
def get_all_data(db: Session = Depends(get_db)):
    subjects = db.query(SubjectDB).all()
    teachers = db.query(TeacherDB).all()
    classes = db.query(ClassGroupDB).all()
    return {
        "subjects": subjects,
        "teachers": teachers,
        "classes": classes
    }

# Health check for DB
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
