from rest_framework import serializers
from .models import Stop, Passenger, Payment, BusLocation, Alert

class StopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stop
        fields = '__all__'

class PassengerSerializer(serializers.ModelSerializer):
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    
    class Meta:
        model = Passenger
        fields = '__all__'
        read_only_fields = ('qr_code', 'boarded_at')

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('transaction_id', 'created_at')

class BusLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusLocation
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    passenger_qr = serializers.CharField(source='passenger.qr_code', read_only=True)
    
    class Meta:
        model = Alert
        fields = '__all__'
