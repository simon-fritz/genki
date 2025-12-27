from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from .models import UserProfile


class PreferencesTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u1", email="u1@test.com", password="pass12345")

    def test_profile_created_on_user_create(self):
        profile = UserProfile.objects.filter(user=self.user).first()
        self.assertIsNotNone(profile)
        self.assertIn("verbosity", profile.preferences)

    def test_get_preferences_requires_auth(self):
        resp = self.client.get("/api/auth/preferences/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_and_patch_preferences(self):
        self.client.force_authenticate(user=self.user)

        resp = self.client.get("/api/auth/preferences/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("preferences", resp.data)

        patch = {
            "preferences": {"verbosity": "concise", "include_analogies": True, "analogy_domain": "everyday"},
            "weights": {"analogies": 0.9},
        }
        resp2 = self.client.patch("/api/auth/preferences/", patch, format="json")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.data["preferences"]["verbosity"], "concise")
        self.assertEqual(resp2.data["preferences"]["analogy_domain"], "everyday")
        self.assertAlmostEqual(float(resp2.data["weights"]["analogies"]), 0.9, places=3)
