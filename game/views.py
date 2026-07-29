"""Views for the dinosaur game."""

from django.views.generic import TemplateView


class GameView(TemplateView):
    """Render the client-side dinosaur game."""

    template_name = "game/index.html"
