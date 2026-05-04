
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    github_username = Column(String(50), unique=True)
    avatar_url = Column(String(255))
    bio = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="owner")
    portfolio = relationship("Portfolio", back_populates="user", uselist=False)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    repo_url = Column(String(255))
    live_url = Column(String(255))
    github_id = Column(Integer, unique=True)
    tags = Column(JSON) # e.g. ["React", "FastAPI"]
    image_url = Column(String(255))
    is_published = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    
    owner = relationship("User", back_populates="projects")

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    slug = Column(String(50), unique=True, index=True) # masalan: portfolio.uz/samandarov
    template_id = Column(String(50), default="minimalist")
    is_published = Column(Boolean, default=False)
    custom_domain = Column(String(255), unique=True, nullable=True)
    settings = Column(JSON) # Font, ranglar va b.
    
    user = relationship("User", back_populates="portfolio")
