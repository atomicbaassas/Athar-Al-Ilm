from django.urls import path

from .views import AdminIntegrationSettingsView, InternalIntegrationKeysView

urlpatterns = [
    path('admin/settings/', AdminIntegrationSettingsView.as_view(), name='admin-integration-settings'),
    path('internal/keys/', InternalIntegrationKeysView.as_view(), name='internal-integration-keys'),
]
