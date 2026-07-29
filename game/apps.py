"""Application configuration for the dinosaur game."""

from django.apps import AppConfig


class GameConfig(AppConfig):
    """Configure the game application."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "game"
