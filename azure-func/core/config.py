import os
import abc

def is_running_on_azure():
    # Check if the WEBSITE_SITE_NAME environment variable is set
    return 'AzureWebJobsStorage' in os.environ

class Singleton(abc.ABCMeta, type):
    """
    Singleton metaclass for ensuring only one instance of a class.
    """

    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(
                Singleton, cls).__call__(
                *args, **kwargs)
        return cls._instances[cls]


class Config(metaclass=Singleton):
    """
    Configuration class to store the state of bools for different scripts access.
    """

    def __init__(self):
        if not is_running_on_azure():
            from dotenv import load_dotenv
            # Load environment variables from .env file
            load_dotenv()

        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.github_api_key = os.getenv("GITHUB_API_KEY")
        self.spotify_client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.spotify_client_id = os.getenv("SPOTIFY_CLIENT_ID")
