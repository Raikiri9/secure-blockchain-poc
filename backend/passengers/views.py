from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count
from math import radians, sin, cos, sqrt, atan2
import uuid

from .models import Stop, Passenger, Payment, BusLocation, Alert
from .serializers import (
    StopSerializer, PassengerSerializer, PaymentSerializer,
    BusLocationSerializer, AlertSerializer
)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two GPS coordinates in km using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

class StopViewSet(viewsets.ModelViewSet):
    """API endpoints for bus stops"""
    queryset = Stop.objects.all()
    serializer_class = StopSerializer
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular destinations"""
        popular_stops = Stop.objects.filter(is_popular=True)
        serializer = self.get_serializer(popular_stops, many=True)
        return Response(serializer.data)

class PassengerViewSet(viewsets.ModelViewSet):
    """API endpoints for passenger management"""
    queryset = Passenger.objects.all()
    serializer_class = PassengerSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active passengers (onboard or outside)"""
        active = Passenger.objects.filter(status__in=['onboard', 'outside'])
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get passenger count"""
        onboard_count = Passenger.objects.filter(status='onboard').count()
        outside_count = Passenger.objects.filter(status='outside').count()
        total_today = Passenger.objects.filter(
            boarded_at__date=timezone.now().date()
        ).count()
        
        return Response({
            'onboard': onboard_count,
            'outside': outside_count,
            'total_today': total_today
        })
    
    @action(detail=False, methods=['post'])
    def board(self, request):
        """Board a new passenger - complete flow with payment"""
        stop_id = request.data.get('stop_id')
        custom_lat = request.data.get('destination_latitude')
        custom_lon = request.data.get('destination_longitude')
        payment_method = request.data.get('payment_method')
        
        if not payment_method:
            return Response(
                {'error': 'Payment method is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create passenger
        passenger_data = {
            'payment_method': payment_method,
            'status': 'onboard'
        }
        
        # Handle destination
        if stop_id:
            try:
                stop = Stop.objects.get(pk=stop_id)
                passenger_data['destination'] = stop.id
                passenger_data['destination_latitude'] = stop.latitude
                passenger_data['destination_longitude'] = stop.longitude
                passenger_data['fare_paid'] = stop.fare
            except Stop.DoesNotExist:
                return Response(
                    {'error': 'Stop not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif custom_lat and custom_lon:
            passenger_data['destination_latitude'] = float(custom_lat)
            passenger_data['destination_longitude'] = float(custom_lon)
            # Default fare for custom destination
            passenger_data['fare_paid'] = request.data.get('fare', 5.00)
        else:
            return Response(
                {'error': 'Destination is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=passenger_data)
        serializer.is_valid(raise_exception=True)
        passenger = serializer.save()
        
        # Create payment record
        payment = Payment.objects.create(
            passenger=passenger,
            amount=passenger.fare_paid,
            payment_method=payment_method,
            status='completed'
        )
        
        # Create welcome alert
        Alert.objects.create(
            passenger=passenger,
            alert_type='payment_confirmed',
            message=f'Payment confirmed. Welcome aboard! Fare: ${passenger.fare_paid}'
        )
        
        return Response({
            'passenger': serializer.data,
            'payment': PaymentSerializer(payment).data,
            'message': 'Passenger boarded successfully'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def scan_qr(self, request, pk=None):
        """Handle QR code scanning for different actions"""
        passenger = self.get_object()
        action_type = request.data.get('action')  # 'going_out', 'returning', 'alighting'
        
        if action_type == 'going_out':
            if passenger.status != 'onboard':
                return Response(
                    {'error': 'Passenger is not onboard'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            passenger.status = 'outside'
            passenger.went_outside_at = timezone.now()
            passenger.save()
            return Response({
                'message': 'Passenger marked as outside',
                'status': passenger.status
            })
            
        elif action_type == 'returning':
            if passenger.status != 'outside':
                return Response(
                    {'error': 'Passenger is not marked as outside'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            passenger.status = 'onboard'
            passenger.returned_inside_at = timezone.now()
            passenger.save()
            return Response({
                'message': 'Passenger returned onboard',
                'status': passenger.status
            })
            
        elif action_type == 'alighting':
            if passenger.status == 'alighted':
                return Response(
                    {'error': 'Passenger already alighted'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            passenger.status = 'alighted'
            passenger.alighted_at = timezone.now()
            passenger.save()
            
            # Create thank you alert
            Alert.objects.create(
                passenger=passenger,
                alert_type='thank_you',
                message='Thank you for using our service!'
            )
            
            return Response({
                'message': 'Passenger alighted successfully',
                'status': passenger.status
            })
        
        return Response(
            {'error': 'Invalid action'},
            status=status.HTTP_400_BAD_REQUEST
        )

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoints for payment records"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class BusLocationViewSet(viewsets.ModelViewSet):
    """API endpoints for bus GPS tracking"""
    queryset = BusLocation.objects.all()
    serializer_class = BusLocationSerializer
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current bus location"""
        location = BusLocation.objects.first()
        if location:
            serializer = self.get_serializer(location)
            return Response(serializer.data)
        return Response({'error': 'No location data'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def update_location(self, request):
        """Update bus location and check for alerts"""
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        speed = request.data.get('speed', 0.0)
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new location record
        location = BusLocation.objects.create(
            latitude=float(latitude),
            longitude=float(longitude),
            speed=float(speed),
            is_moving=float(speed) > 1.0  # Consider moving if speed > 1 km/h
        )
        
        alerts_created = []
        
        # Check if bus is moving and passengers are outside
        if location.is_moving:
            outside_passengers = Passenger.objects.filter(status='outside')
            for passenger in outside_passengers:
                # Check if we haven't alerted recently (within 5 minutes)
                if not passenger.last_notified_at or \
                   (timezone.now() - passenger.last_notified_at).total_seconds() > 300:
                    alert = Alert.objects.create(
                        passenger=passenger,
                        alert_type='restroom_left_behind',
                        message=f'Warning: Passenger {passenger.qr_code[:8]} is still outside the bus!'
                    )
                    passenger.last_notified_at = timezone.now()
                    passenger.save()
                    alerts_created.append(alert.id)
        
        # Check passengers approaching destination (within 5km)
        onboard_passengers = Passenger.objects.filter(status='onboard')
        for passenger in onboard_passengers:
            if passenger.destination_latitude and passenger.destination_longitude:
                distance = calculate_distance(
                    location.latitude, location.longitude,
                    passenger.destination_latitude, passenger.destination_longitude
                )
                
                # Approaching destination (within 5km)
                if distance <= 5 and distance > 0:
                    # Check if we haven't alerted recently
                    if not passenger.last_notified_at or \
                       (timezone.now() - passenger.last_notified_at).total_seconds() > 300:
                        alert = Alert.objects.create(
                            passenger=passenger,
                            alert_type='approaching_destination',
                            message=f'Approaching your destination. Distance: {distance:.1f} km'
                        )
                        passenger.last_notified_at = timezone.now()
                        passenger.save()
                        alerts_created.append(alert.id)
                
                # Overdue passenger (20km past destination)
                elif distance >= 20 and not passenger.is_overdue:
                    alert = Alert.objects.create(
                        passenger=passenger,
                        alert_type='overdue_passenger',
                        message=f'Alert: Passenger {passenger.qr_code[:8]} is {distance:.1f} km past destination!'
                    )
                    passenger.is_overdue = True
                    passenger.last_notified_at = timezone.now()
                    passenger.save()
                    alerts_created.append(alert.id)
        
        return Response({
            'location': BusLocationSerializer(location).data,
            'alerts_created': alerts_created,
            'message': f'{len(alerts_created)} alerts created'
        })

class AlertViewSet(viewsets.ModelViewSet):
    """API endpoints for system alerts"""
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending (unplayed) alerts"""
        pending = Alert.objects.filter(is_played=False).order_by('created_at')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_played(self, request, pk=None):
        """Mark alert as played"""
        alert = self.get_object()
        alert.is_played = True
        alert.played_at = timezone.now()
        alert.save()
        return Response({'message': 'Alert marked as played'})
