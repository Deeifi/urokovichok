from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.orm import Session

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
    
    # Optionally save the generated schedule to DB
    # new_schedule = ScheduleDB(name="Generated", lessons=result["lessons"])
    # db.add(new_schedule)
    # db.commit()
    
    return result

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
