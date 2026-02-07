from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel 
from typing import Optional
from datetime import date
from datetime import datetime, timedelta
from backend.database import User, get_db, Train, Booking, Payment
from backend.security import hash_password, verify_password, create_access_token
from backend.invoice import generate_invoice, FileResponse
import os

app = FastAPI()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Create_Acc(BaseModel):
    name: str
    phone_no: str
    email: str
    password: str


class Login(BaseModel):
    email: str
    password: str


class TrainOut(BaseModel):
    id: int
    train_no: str
    train_name: str
    from_: str
    to_: str
    no_of_seats: int
    ac_price: int
    non_ac_price: int
    departuretime: str 
    image_url: str

    class Config:
        orm_mode = True


class BookingCreate(BaseModel):
    user_id: int
    train_no: str
    from_city: str
    to_city: str
    booked_date: date
    travel_date: date
    total_seats: int
    total_price: int
    payment_method: Optional[str] = "UNKNOWN"

@app.post("/create_ac")
def create_acc(CR: Create_Acc, db: Session = Depends(get_db)):
    # check email already exists
    existing_user = db.query(User).filter(User.email == CR.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hash_pw = hash_password(CR.password)
    new_user = User(
        name=CR.name,
        Phone_num=CR.phone_no,
        email=CR.email,
        password=hash_pw)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@app.post("/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password")

    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id)},
                                       expires_delta=timedelta(minutes=60))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email}}


@app.get("/trains")
def get_trains(from_city: str, to_city: str, db: Session = Depends(get_db)):
    trains = db.query(Train).filter(
        Train.from_ == from_city,
        Train._to == to_city
    ).all()
    # Frontend expects "departuretime" (no underscore)
    return [
        {
            "id": t.id,
            "train_no": t.train_no,
            "train_name": t.train_name,
            "from_": t.from_,
            "to_": t._to,
            "no_of_seats": t.no_of_seats,
            "ac_price": t.ac_price,
            "non_ac_price": t.non_ac_price,
            "departuretime": t.departure_time,
            
            "image_url": t.image_url or "",
        }
        for t in trains
    ]


class PaymentCreate(BaseModel):
    user_id: int
    booking_id: int
    payment_method: str
    amount: int
    status: str


@app.get("/cities")
def get_cities(db: Session = Depends(get_db)):
    from_cities = db.query(Train.from_).distinct().all()
    to_cities = db.query(Train._to).distinct().all()

    cities = {c[0] for c in from_cities} | {c[0] for c in to_cities}
    return sorted(cities)


@app.post("/bookings")
def create_booking(data: BookingCreate, db: Session = Depends(get_db)):
    # 1. Save booking
    booking = Booking(
        user_id=data.user_id,
        train_no=data.train_no,
        from_city=data.from_city,
        to_city=data.to_city,
        booked_date=data.booked_date,
        travel_date = data.travel_date,
        total_seats=data.total_seats,
        total_price=data.total_price,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    # 2. Save payment
    payment = Payment(
        user_id=data.user_id,
        booking_id=booking.id,
        payment_method=data.payment_method,
        amount=data.total_price,
        status="SUCCESS",
    )

    db.add(payment)
    db.commit()

    return {
        "booking_id": booking.id,
        "message": "Booking & payment saved"
    }


@app.get("/invoice/{booking_id}")
def download_invoice(booking_id: int, db: Session = Depends(get_db)):
    try:
        print("Fetching booking", booking_id)
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        print("Booking found:", booking.id)

        user = db.query(User).filter(User.id == booking.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        print("User found:", user.id)

        payment = db.query(Payment).filter(
            Payment.booking_id == booking.id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        print("Payment found:", payment.id)

        # Make sure folder exists
        os.makedirs("invoices", exist_ok=True)

        # Generate PDF
        file_path = generate_invoice(booking, user, payment)
        print("PDF generated at", file_path)

        return FileResponse(file_path, media_type="application/pdf", filename=f"invoice_{booking.id}.pdf")

    except Exception as e:
        print("Error generating invoice:", e)
        raise HTTPException(status_code=500, detail=str(e))
