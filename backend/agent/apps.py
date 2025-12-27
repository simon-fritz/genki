from django.apps import AppConfig
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

class AgentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "agent"
    
    def ready(self):
        if not getattr(settings, "GEMINI_API_KEY", ""):
            raise ImproperlyConfigured("GEMINI_API_KEY is required for the agent module")