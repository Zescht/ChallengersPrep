"""Load the Valolytics API key from the environment or the repo-root .env (never commit the key)."""

import os
import sys

_ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')


def load_api_key():
    key = os.environ.get('VALOLYTICS_API_KEY')
    if key:
        return key.strip()
    if os.path.exists(_ENV_PATH):
        with open(_ENV_PATH, encoding='utf-8') as f:
            for line in f:
                name, _, value = line.strip().partition('=')
                if name == 'VALOLYTICS_API_KEY' and value:
                    return value.strip().strip('"\'')
    sys.exit('VALOLYTICS_API_KEY is not set. Add it to .env (see .env.example) or export it.')
