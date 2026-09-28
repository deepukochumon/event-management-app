from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.events.views import EventViewSet, DashboardView
from apps.venues.views import VenueViewSet
from apps.users.views import UserViewSet, MeView
from apps.registrations.views import RegistrationViewSet, AttendeeViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'users', UserViewSet, basename='user')
router.register(r'registrations', RegistrationViewSet, basename='registration')
router.register(r'attendees', AttendeeViewSet, basename='attendee')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/', include(router.urls)),
]
