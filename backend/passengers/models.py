from django.db import models
from django.utils import timezone
import uuid

class Stop(models.Model):
    """Bus stops/destinations"""
    name = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    fare = models.DecimalField(max_digits=10, decimal_places=2)
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ${self.fare}"

class Passenger(models.Model):
    """Passenger information and status"""
    STATUS_CHOICES = [
        ('onboard', 'Onboard'),
        ('outside', 'Outside (Restroom)'),
        ('alighted', 'Alighted'),
    ]
    
    PAYMENT_CHOICES = [
        ('ecocash', 'Ecocash'),
        ('debit_card', 'Debit Card'),
    ]
    
    qr_code = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    destination = models.ForeignKey(Stop, on_delete=models.SET_NULL, null=True)
    destination_latitude = models.FloatField(null=True, blank=True)
    destination_longitude = models.FloatField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    fare_paid = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='onboard')
    boarded_at = models.DateTimeField(default=timezone.now)
    alighted_at = models.DateTimeField(null=True, blank=True)
    went_outside_at = models.DateTimeField(null=True, blank=True)
    returned_inside_at = models.DateTimeField(null=True, blank=True)
    is_overdue = models.BooleanField(default=False)
    last_notified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Passenger {self.qr_code[:8]} - {self.status}"

class Payment(models.Model):
    """Payment transaction records"""
    passenger = models.ForeignKey(Passenger, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20)
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    status = models.CharField(max_length=20, default='completed')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment {self.transaction_id[:8]} - ${self.amount}"

class BusLocation(models.Model):
    """Real-time bus GPS location"""
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(default=0.0)  # km/h
    is_moving = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Bus at ({self.latitude}, {self.longitude}) - {self.timestamp}"

class Alert(models.Model):
    """System alerts for voice notifications"""
    ALERT_TYPES = [
        ('payment_confirmed', 'Payment Confirmed'),
        ('restroom_left_behind', 'Passenger Left Behind'),
        ('approaching_destination', 'Approaching Destination'),
        ('overdue_passenger', 'Overdue Passenger'),
        ('thank_you', 'Thank You'),
    ]
    
    passenger = models.ForeignKey(Passenger, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True)
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    message = models.TextField()
    is_played = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    played_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.alert_type} - {self.created_at}"
