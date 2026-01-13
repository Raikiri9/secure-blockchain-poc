from django.contrib import admin
from .models import Stop, Passenger, Payment, BusLocation, Alert

@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude', 'fare', 'is_popular')
    list_filter = ('is_popular',)
    search_fields = ('name',)

@admin.register(Passenger)
class PassengerAdmin(admin.ModelAdmin):
    list_display = ('qr_code', 'destination', 'payment_method', 'fare_paid', 'status', 'boarded_at')
    list_filter = ('status', 'payment_method', 'is_overdue')
    search_fields = ('qr_code',)
    readonly_fields = ('qr_code', 'boarded_at')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'passenger', 'amount', 'payment_method', 'status', 'created_at')
    list_filter = ('payment_method', 'status')
    search_fields = ('transaction_id',)
    readonly_fields = ('transaction_id', 'created_at')

@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    list_display = ('latitude', 'longitude', 'speed', 'is_moving', 'timestamp')
    list_filter = ('is_moving',)
    readonly_fields = ('timestamp',)

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('alert_type', 'passenger', 'is_played', 'created_at', 'played_at')
    list_filter = ('alert_type', 'is_played')
    readonly_fields = ('created_at',)
