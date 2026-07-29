"""WSGI configuration for the dinosaur game."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dino_game.settings")

application = get_wsgi_application()
