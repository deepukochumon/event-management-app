from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.events.views import EventViewSet, VenueViewSet, AttendeeViewSet, RegistrationViewSet, dashboard_stats, calendar_events
from apps.users.views import UserViewSet, me

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'attendees', AttendeeViewSet, basename='attendee')
router.register(r'registrations', RegistrationViewSet, basename='registration')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', me, name='me'),
    path('api/dashboard/', dashboard_stats, name='dashboard-stats'),
    path('api/calendar/', calendar_events, name='calendar-events'),
    path('api/', include(router.urls)),
]
