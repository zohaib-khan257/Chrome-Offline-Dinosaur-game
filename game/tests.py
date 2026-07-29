"""Tests for the game application."""

from django.test import TestCase
from django.urls import reverse


class GamePageTests(TestCase):
    """Verify the public game page."""

    def test_game_page_loads(self) -> None:
        response = self.client.get(reverse("game:home"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "game/index.html")
