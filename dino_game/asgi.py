"""ASGI configuration for the dinosaur game."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dino_game.settings")

application = get_asgi_application()
