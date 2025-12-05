from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Swagger/OpenAPI Schema Configuration
schema_view = get_schema_view(
    openapi.Info(
        title="Anki GenAI API",
        default_version="v1",
        description="API documentation for Anki GenAI with JWT Authentication",
        contact=openapi.Contact(email="support@example.com"),
        license=openapi.License(name="MIT"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/core/", include("core.urls")),
    path("api/", include("cards.urls")),
    path("api/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("api/docs/swagger.json", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("", RedirectView.as_view(url="/api/docs/", permanent=False)),
]

