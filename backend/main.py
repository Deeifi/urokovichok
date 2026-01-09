from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ScheduleRequest
from solver import generate_schedule

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "School Scheduler API is running"}

@app.post("/api/generate")
def generate(request: ScheduleRequest):
    result = generate_schedule(request)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result
