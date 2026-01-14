from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./school_scheduler.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class SubjectDB(Base):
    __tablename__ = "subjects"
    id = Column(String, primary_key=True)
    name = Column(String)
    color = Column(String, nullable=True)

class TeacherDB(Base):
    __tablename__ = "teachers"
    id = Column(String, primary_key=True)
    name = Column(String)
    is_primary = Column(Boolean, default=False)
    prefers_period_zero = Column(Boolean, default=False)
    photo = Column(String, nullable=True)
    availability = Column(JSON, nullable=True)

class ClassGroupDB(Base):
    __tablename__ = "classes"
    id = Column(String, primary_key=True)
    name = Column(String)
    excluded_subjects = Column(JSON, default=[])

class teachingPlanDB(Base):
    __tablename__ = "teaching_plan"
    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(String, ForeignKey("classes.id"))
    subject_id = Column(String, ForeignKey("subjects.id"))
    teacher_id = Column(String, ForeignKey("teachers.id"))
    hours_per_week = Column(Integer)

class ScheduleDB(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, default="Original Schedule")
    lessons = Column(JSON)  # List of lessons as JSON
    created_at = Column(String) # Simple timestamp
