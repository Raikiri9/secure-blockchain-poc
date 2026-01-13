from django.core.management.base import BaseCommand
from passengers.models import Stop

class Command(BaseCommand):
    help = 'Load sample bus stops data'

    def handle(self, *args, **options):
        stops_data = [
            {"name": "Central Station", "latitude": -17.8252, "longitude": 31.0335, "fare": 2.50, "is_popular": True},
            {"name": "City Mall", "latitude": -17.8292, "longitude": 31.0520, "fare": 3.00, "is_popular": True},
            {"name": "University Campus", "latitude": -17.7840, "longitude": 31.0530, "fare": 4.50, "is_popular": True},
            {"name": "Airport Terminal", "latitude": -17.9318, "longitude": 31.0928, "fare": 8.00, "is_popular": True},
            {"name": "Industrial Area", "latitude": -17.8650, "longitude": 31.0150, "fare": 5.00, "is_popular": True},
            {"name": "Market Square", "latitude": -17.8320, "longitude": 31.0450, "fare": 2.00, "is_popular": True},
            {"name": "Hospital District", "latitude": -17.8180, "longitude": 31.0380, "fare": 3.50, "is_popular": True},
            {"name": "Sports Complex", "latitude": -17.8450, "longitude": 31.0680, "fare": 4.00, "is_popular": True},
        ]
        
        for stop_data in stops_data:
            stop, created = Stop.objects.get_or_create(
                name=stop_data["name"],
                defaults={
                    "latitude": stop_data["latitude"],
                    "longitude": stop_data["longitude"],
                    "fare": stop_data["fare"],
                    "is_popular": stop_data["is_popular"]
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created stop: {stop.name}'))
            else:
                self.stdout.write(f'Stop already exists: {stop.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Total stops: {Stop.objects.count()}'))
