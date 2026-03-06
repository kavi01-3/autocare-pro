from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str = "owner"  # owner, admin
    phone: Optional[str] = None
    city: Optional[str] = None
    
    vehicles: List["Vehicle"] = Relationship(back_populates="user")
    bookings: List["Booking"] = Relationship(back_populates="user")
    notifications: List["Notification"] = Relationship(back_populates="user")

class Vehicle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    type: str  # Car, Bike, SUV, etc.
    model: str
    reg_number: str
    year: int
    color: Optional[str] = None
    
    user: User = Relationship(back_populates="vehicles")
    bookings: List["Booking"] = Relationship(back_populates="vehicle")

class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    price: float
    description: str
    duration: str
    category: str  # Basic, Standard, Premium
    
    bookings: List["Booking"] = Relationship(back_populates="service")

class Booking(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    vehicle_id: int = Field(foreign_key="vehicle.id")
    service_id: int = Field(foreign_key="service.id")
    date: str
    slot: str
    status: str = "Requested"  # Requested, Approved, In Service, Completed, Cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    invoice_id: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    
    user: User = Relationship(back_populates="bookings")
    vehicle: Vehicle = Relationship(back_populates="bookings")
    service: Service = Relationship(back_populates="bookings")

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    icon: str
    title: str
    message: str
    time: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    
    user: User = Relationship(back_populates="notifications")

class Center(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: str
    phone: str
    hours: str
    capacity: int
    status: str = "Active"
    rating: float = 0.0
