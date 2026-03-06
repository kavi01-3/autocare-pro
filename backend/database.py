from sqlmodel import Session, SQLModel, create_engine, select
from models import User, Vehicle, Service, Booking, Notification, Center
from passlib.context import CryptContext
import os

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def seed_data():
    with Session(engine) as session:
        # Check if users already exist
        statement = select(User)
        results = session.exec(statement)
        if results.first():
            return

        # Users
        user1 = User(name="Ravi Kumar", email="owner@demo.com", password_hash=pwd_context.hash("demo123"), role="owner", phone="+91 98765 43210", city="Chennai")
        user2 = User(name="Dhanasekar", email="admin@demo.com", password_hash=pwd_context.hash("demo123"), role="admin", phone="+91 91234 56789", city="Chennai")
        session.add(user1)
        session.add(user2)
        session.commit()
        session.refresh(user1)
        session.refresh(user2)

        # Vehicles
        v1 = Vehicle(user_id=user1.id, type="Car", model="Toyota Camry", reg_number="TN 01 AB 1234", year=2021, color="Pearl White")
        v2 = Vehicle(user_id=user1.id, type="Bike", model="Royal Enfield Bullet 350", reg_number="TN 02 CD 5678", year=2022, color="Redditch Red")
        v3 = Vehicle(user_id=user1.id, type="SUV", model="Mahindra Thar", reg_number="TN 03 EF 9012", year=2023, color="Galaxy Grey")
        session.add(v1)
        session.add(v2)
        session.add(v3)

        # Services
        services = [
            Service(name="Oil Change", price=599, description="Engine oil replacement with filter change. Keeps your engine running smoothly.", duration="45 min", category="Basic"),
            Service(name="General Service", price=1999, description="Full vehicle inspection, fluid top-up, brake check, and air filter service.", duration="3-4 hours", category="Standard"),
            Service(name="Brake Check & Repair", price=1299, description="Complete brake system inspection, pad replacement & rotor resurfacing if needed.", duration="1-2 hours", category="Standard"),
            Service(name="Premium Full Service", price=3999, description="Complete vehicle overhaul – engine tuning, AC service, body polish & deep cleaning.", duration="6-8 hours", category="Premium"),
            Service(name="Tyre Rotation & Balance", price=699, description="Rotate all four tyres and perform wheel balancing for even wear and smooth drive.", duration="1 hour", category="Basic"),
            Service(name="AC Service & Gas Refill", price=1799, description="AC compressor check, cooling coil cleaning and refrigerant gas refill.", duration="2-3 hours", category="Standard"),
            Service(name="Engine Diagnostics", price=899, description="Full OBD scan and diagnostic report. Identify hidden faults before they worsen.", duration="1 hour", category="Basic"),
            Service(name="Full Body Detailing", price=2499, description="Exterior wash, clay bar treatment, paint sealant, interior vacuum & leather care.", duration="4-5 hours", category="Premium"),
        ]
        for s in services:
            session.add(s)
        
        # Committing twice to get IDs for bookings
        session.commit()
        
        # Fetching back services to get IDs
        s_list = session.exec(select(Service)).all()
        s_map = {s.name: s.id for s in s_list}

        # Bookings (a few examples)
        from datetime import datetime
        b1 = Booking(user_id=user1.id, vehicle_id=v1.id, service_id=s_map["General Service"], date="2026-01-15", slot="10:00 AM", status="Completed", rating=5, review="Excellent service!")
        b2 = Booking(user_id=user1.id, vehicle_id=v2.id, service_id=s_map["Oil Change"], date="2026-02-05", slot="2:00 PM", status="Completed", rating=4, review="Good and quick service.")
        session.add(b1)
        session.add(b2)

        # Centers
        centers = [
            Center(name="AutoCare Downtown", location="12 Anna Salai, Chennai – 600002", phone="+91 98765 43210", hours="9 AM – 7 PM", capacity=25, status="Active", rating=4.8),
            Center(name="AutoCare West Hub", location="45 Mount Road, Guindy, Chennai – 600032", phone="+91 98765 43211", hours="8 AM – 6 PM", capacity=20, status="Active", rating=4.6),
        ]
        for c in centers:
            session.add(c)
            
        session.commit()

def get_session():
    with Session(engine) as session:
        yield session
