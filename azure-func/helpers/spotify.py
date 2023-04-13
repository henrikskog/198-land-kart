import requests
from helpers.config import Config

cfg = Config()

CLIENT_ID = cfg.spotify_client_id
CLIENT_SECRET = cfg.spotify_client_secret

AUTH_URL = 'https://accounts.spotify.com/api/token'

def get_auth_token():
    auth_response = requests.post(AUTH_URL, {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
    })

    auth_response_data = auth_response.json()
    access_token = auth_response_data['access_token']
    return access_token

def get_episodes(show_id, access_token):
    headers = {
        'Authorization': 'Bearer {token}'.format(token=access_token)
    }

    BASE_URL = 'https://api.spotify.com/v1/'
    limit = 50  # Maximum allowed by Spotify API
    offset = 0
    episodes = []

    while True:
        response = requests.get(
            BASE_URL + f'shows/{show_id}/episodes',
            headers=headers,
            params={
                'limit': limit,
                'offset': offset,
                'market': 'NO'
            }
        )

        response_data = response.json()
        episodes.extend(response_data['items'])

        # Check if there's a next page
        if response_data['next']:
            offset += limit
        else:
            break

    return episodes

def get_198_land_episodes():
    access_token = get_auth_token()
    show_id = '7gVC1AP7O35An9TK6l2XpJ' # 198 Land ID
    episodes = get_episodes(show_id, access_token)
    return episodes