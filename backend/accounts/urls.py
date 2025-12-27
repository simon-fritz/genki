from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('user/', views.user_info, name='user_info'),
    path("preferences/", views.preferences, name="preferences"),
]
