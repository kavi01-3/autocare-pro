from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import engine, get_session, create_db_and_tables, seed_data, pwd_context
from models import User, Vehicle, Service, Booking, Notification, Center

from pydantic import BaseModel
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AutoCare Pro API")

# -----------------------------
# Enable CORS
# -----------------------------

# CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# ROOT ROUTE
# -----------------------------
@app.get("/")
def read_root():
    return {"message": "AutoCare API is running"}

# -----------------------------
# Startup Event
# -----------------------------
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_data()

# -----------------------------
# AUTH MODELS
# -----------------------------
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str


# -----------------------------
# AUTH ROUTES
# -----------------------------
@app.post("/auth/login")
def login(req: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == req.email)).first()

    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user


@app.post("/auth/register")
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == req.email)).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=pwd_context.hash(req.password),
        role=req.role
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


# -----------------------------
# VEHICLES
# -----------------------------
@app.get("/vehicles", response_model=List[Vehicle])
def get_vehicles(user_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Vehicle).where(Vehicle.user_id == user_id)).all()


@app.post("/vehicles", response_model=Vehicle)
def add_vehicle(vehicle: Vehicle, session: Session = Depends(get_session)):
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


@app.put("/vehicles/{vehicle_id}", response_model=Vehicle)
def update_vehicle(vehicle_id: int, vehicle_data: Vehicle, session: Session = Depends(get_session)):

    db_vehicle = session.get(Vehicle, vehicle_id)

    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    for key, value in vehicle_data.dict().items():
        if key != "id":
            setattr(db_vehicle, key, value)

    session.add(db_vehicle)
    session.commit()
    session.refresh(db_vehicle)

    return db_vehicle


@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, session: Session = Depends(get_session)):

    vehicle = session.get(Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    session.delete(vehicle)
    session.commit()

    return {"message": "Vehicle deleted successfully"}


# -----------------------------
# SERVICES
# -----------------------------
@app.get("/services", response_model=List[Service])
def get_services(session: Session = Depends(get_session)):
    return session.exec(select(Service)).all()


@app.post("/services", response_model=Service)
def add_service(service: Service, session: Session = Depends(get_session)):

    session.add(service)
    session.commit()
    session.refresh(service)

    return service


# -----------------------------
# BOOKINGS
# -----------------------------
@app.get("/bookings")
def get_bookings(user_id: Optional[int] = None, session: Session = Depends(get_session)):

    if user_id:
        statement = select(Booking).where(Booking.user_id == user_id)
    else:
        statement = select(Booking)

    return session.exec(statement).all()


@app.post("/bookings", response_model=Booking)
def add_booking(booking: Booking, session: Session = Depends(get_session)):

    session.add(booking)
    session.commit()
    session.refresh(booking)

    return booking


@app.patch("/bookings/{booking_id}")
def update_booking(booking_id: int, updates: dict, session: Session = Depends(get_session)):

    booking = session.get(Booking, booking_id)

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    for key, value in updates.items():
        setattr(booking, key, value)

    session.add(booking)
    session.commit()
    session.refresh(booking)

    return booking


# -----------------------------
# NOTIFICATIONS
# -----------------------------
@app.get("/notifications", response_model=List[Notification])
def get_notifications(user_id: int, session: Session = Depends(get_session)):

    statement = select(Notification).where(Notification.user_id == user_id).order_by(Notification.time.desc())

    return session.exec(statement).all()


@app.patch("/notifications/{notif_id}/read")
def mark_notif_read(notif_id: int, session: Session = Depends(get_session)):

    notif = session.get(Notification, notif_id)

    if notif:
        notif.read = True
        session.add(notif)
        session.commit()

    return {"message": "Notification updated"}


@app.post("/notifications")
def add_notification(notif: Notification, session: Session = Depends(get_session)):

    session.add(notif)
    session.commit()
    session.refresh(notif)

    return notif


# -----------------------------
# USER PROFILE
# -----------------------------
@app.patch("/users/{user_id}")
def update_user(user_id: int, updates: dict, session: Session = Depends(get_session)):

    user = session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in updates.items():
        if key != "password_hash":
            setattr(user, key, value)

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


# -----------------------------
# SERVICE CENTERS
# -----------------------------
@app.get("/centers", response_model=List[Center])
def get_centers(session: Session = Depends(get_session)):
    return session.exec(select(Center)).all()


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)