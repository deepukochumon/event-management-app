from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet, AuthView, MeView
from apps.venues.views import VenueViewSet
from apps.events.views import EventViewSet, DashboardView, CalendarView
from apps.attendees.views import AttendeeViewSet
from apps.registrations.views import RegistrationViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'events', EventViewSet, basename='event')
router.register(r'attendees', AttendeeViewSet, basename='attendee')
router.register(r'registrations', RegistrationViewSet, basename='registration')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', AuthView.as_view(), name='auth'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/calendar/', CalendarView.as_view(), name='calendar'),
    path('api/', include(router.urls)),
]
