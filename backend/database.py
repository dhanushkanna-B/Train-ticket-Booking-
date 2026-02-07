import os
from sqlalchemy import create_engine, Integer, Column, String, Date, ForeignKey,DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)



SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
    Phone_num = Column(String(20))
    email = Column(String(50), unique=True)
    password = Column(String(300))


class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_no = Column(String(40), unique=True, nullable=False)
    train_name = Column(String(100), nullable=False)
    from_ = Column(String(100), nullable=False)
    _to = Column(String(100), nullable=False)
    no_of_seats = Column(Integer, nullable=False)
    ac_price = Column(Integer, nullable=False)
    non_ac_price = Column(Integer, nullable=False)
    departure_time = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=True)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    train_no = Column(String(20))
    from_city = Column(String(50))
    to_city = Column(String(50))
    booked_date = Column(Date, default=datetime.utcnow)
    travel_date = Column(Date, nullable=True)
    total_seats = Column(Integer)
    total_price = Column(Integer)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)

    # upi / netbanking / card
    payment_method = Column(String(50), nullable=False)
    amount = Column(Integer, nullable=False)

    status = Column(String(30), nullable=False)  
    paid_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)
