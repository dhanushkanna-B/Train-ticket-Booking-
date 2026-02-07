
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime
import os


def generate_invoice(booking, user, payment):
    """
    booking: Booking SQLAlchemy object
    user: User SQLAlchemy object
    payment: Payment SQLAlchemy object
    """

    folder = "invoices"
    os.makedirs(folder, exist_ok=True)

    filename = f"invoice_{booking.id}.pdf"
    filepath = os.path.join(folder, filename)

    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4

    # Heading
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2, height - 50, "ONLINE TRAIN TICKET BOOKING")

    # Subtitle
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 80, "Passenger Ticket Invoice")

    # Line separator
    c.setStrokeColor(colors.grey)
    c.setLineWidth(1)
    c.line(50, height - 95, width - 50, height - 95)

    # Details start
    y = height - 130
    line_height = 22
    c.setFont("Helvetica", 12)

    details = [
    
        ("Passenger Name", user.name),
        ("Phone", user.Phone_num),
        ("Train Number", booking.train_no),
        ("From", booking.from_city),
        ("To", booking.to_city),
        ("booking_date", booking.booked_date),
        ("Date of Travel", booking.travel_date),
        ("Seats Booked", booking.total_seats),
        ("Total Price", f"₹{booking.total_price}"),
        ("Payment Method", payment.payment_method),
        ("Payment Status", payment.status),
        ("Payment Date", payment.paid_at)
    ]

    # Draw details centered
    for label, value in details:
        text = f"{label}: {value}"
        c.drawCentredString(width / 2, y, text)
        y -= line_height

    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredString(
        width / 2, 50, "Thank you for booking with us! Have a safe journey.")
    c.drawRightString(
        width - 50, 30, f"Issued: {datetime.now().strftime('%d-%m-%Y %H:%M')}")

    c.showPage()
    c.save()

    return filepath
