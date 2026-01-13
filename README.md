# Smart Bus Conductor Mobile Application

## Overview
A comprehensive Smart Bus Conductor Mobile Application designed for Android tablets installed inside public buses. The application streamlines passenger boarding, fare payment, real-time tracking, and safety protocols—especially during restroom breaks or drop-offs.

## Features

### Core Functionality
- **Home Screen**: Intuitive interface for conductors to manage passengers and operations
- **Destination Selection**: Interactive map with Google Maps API integration and popular destinations
- **Payment Processing**: Support for Ecocash (mobile money) and Debit Card payments
- **QR Code System**: Unique QR codes for each passenger for tracking and verification
- **GPS Tracking**: Real-time bus location monitoring and distance calculations
- **Voice Alerts**: Text-to-Speech notifications for various events

### Passenger Management
- Board new passengers with destination and payment selection
- Track passenger status (onboard, outside, alighted)
- View active passengers and their destinations
- Automatic passenger counting

### Safety Features
- **Restroom Break Protocol**: 
  - Passengers scan QR when going out
  - Alert if bus moves while passenger is outside
  - Scan again when returning to clear alert
- **Proximity Alerts**:
  - 5km warning when approaching destination
  - 20km alert for overdue passengers past their stop
- **Voice Notifications**: Audio alerts for all critical events

## Technical Stack

### Backend
- **Framework**: Django 6.0.1 + Django REST Framework 3.16.1
- **Database**: SQLite (local/mobile) and PostgreSQL (server-ready)
- **APIs**: RESTful API endpoints for all operations
- **Libraries**: 
  - QR code generation (qrcode, pillow)
  - CORS support (django-cors-headers)

### Frontend
- **Technology**: HTML5, CSS3, JavaScript (Web-based prototype)
- **Features**:
  - Responsive design optimized for tablets
  - Real-time updates via polling
  - Voice synthesis for alerts (Web Speech API)
  - QR code display and scanning interface

### Mapping & GPS
- Google Maps API integration (placeholder for implementation)
- Haversine formula for distance calculations
- Real-time location tracking

## Installation & Setup

### Prerequisites
- Python 3.12+
- pip (Python package manager)
- Modern web browser

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install django djangorestframework django-cors-headers qrcode pillow
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Load sample bus stops data:
```bash
python manage.py load_sample_data
```

5. Start the Django development server:
```bash
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Open the frontend directory
2. Serve the HTML files using any web server, or simply open `frontend/index.html` in a web browser
3. For development, you can use Python's built-in server:
```bash
cd frontend
python -m http.server 8080
```

Then access the application at `http://localhost:8080`

## API Endpoints

### Passengers
- `GET /api/passengers/` - List all passengers
- `GET /api/passengers/active/` - Get active passengers
- `GET /api/passengers/count/` - Get passenger counts
- `POST /api/passengers/board/` - Board a new passenger
- `POST /api/passengers/{id}/scan_qr/` - Handle QR code scanning

### Stops
- `GET /api/stops/` - List all bus stops
- `GET /api/stops/popular/` - Get popular destinations

### Bus Location
- `GET /api/bus-location/current/` - Get current bus location
- `POST /api/bus-location/update_location/` - Update GPS location

### Alerts
- `GET /api/alerts/` - List all alerts
- `GET /api/alerts/pending/` - Get unplayed alerts
- `POST /api/alerts/{id}/mark_played/` - Mark alert as played

### Payments
- `GET /api/payments/` - View payment records

## Usage Guide

### Boarding a Passenger
1. Click "New Passenger" on home screen
2. Select destination from popular stops or enter custom coordinates
3. Choose payment method (Ecocash or Debit Card)
4. Confirm boarding
5. QR code is generated and displayed

### Scanning QR Codes
1. Click "Scan QR Code" on home screen
2. Enter or scan passenger's QR code
3. Select action:
   - **Going Out**: Mark passenger as outside (restroom break)
   - **Returning**: Mark passenger as back onboard
   - **Alighting**: Passenger leaving the bus

### Tracking the Bus
1. Click "Track Bus" on home screen
2. View current GPS location
3. Update location manually or simulate movement
4. System automatically checks for alerts:
   - Passengers left outside while bus is moving
   - Passengers approaching destinations
   - Overdue passengers

### Viewing Alerts
1. Click "Alerts" on home screen
2. View pending and recent alerts
3. Play voice alerts manually if needed
4. Alerts are automatically played when triggered

## Project Structure

```
secure-blockchain-poc/
├── backend/
│   ├── bus_conductor/          # Django project settings
│   ├── passengers/             # Main app
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API views
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # URL routing
│   │   └── admin.py           # Admin interface
│   ├── manage.py              # Django management script
│   └── db.sqlite3             # SQLite database
├── frontend/
│   ├── index.html             # Home screen
│   ├── board.html             # Passenger boarding
│   ├── scan.html              # QR code scanning
│   ├── tracking.html          # GPS tracking
│   ├── passengers.html        # Passenger list
│   ├── alerts.html            # Alert management
│   └── reports.html           # Reports & analytics
└── README.md                  # This file
```

## Database Models

### Stop
Bus stops and destinations with GPS coordinates and fares

### Passenger
Passenger records with QR codes, destinations, payment info, and status tracking

### Payment
Payment transaction records for auditing

### BusLocation
Real-time GPS location history of the bus

### Alert
System alerts for voice notifications

## Future Enhancements

- React Native mobile app for true Android tablet deployment
- Real Google Maps integration with actual GPS hardware
- Actual QR code camera scanning (using device camera)
- PostgreSQL production database setup
- Payment gateway integrations (Ecocash API, card processing)
- Driver and conductor authentication
- Route planning and optimization
- Passenger analytics and reporting
- Multi-bus fleet management
- Push notifications using Expo Notifications

## Security Considerations

- QR codes are unique UUIDs for each passenger
- Payment records are stored securely
- CORS is configured (update for production)
- Input validation on all API endpoints
- Ready for HTTPS deployment

## Development Notes

This is a prototype/proof-of-concept implementation demonstrating the core functionality. For production deployment:
- Replace simulated GPS with actual device GPS
- Implement real payment gateway integrations
- Add authentication and authorization
- Deploy with production-grade web server (Gunicorn/uWSGI)
- Use PostgreSQL for production database
- Implement proper error handling and logging
- Add comprehensive test coverage

## License

ISC

## Academic Use
Designed as a comprehensive project demonstrating mobile application development, REST API design, real-time tracking, and IoT integration concepts.