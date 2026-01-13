from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'stops', views.StopViewSet)
router.register(r'passengers', views.PassengerViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'bus-location', views.BusLocationViewSet)
router.register(r'alerts', views.AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
