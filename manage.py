#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""

import os
import sys


def main() -> None:
    """Run administrative commands."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dino_game.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as error:
        raise ImportError(
            "Django could not be imported. Install the project dependencies first."
        ) from error
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
