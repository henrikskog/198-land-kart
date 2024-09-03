import requests

AUTH_URL = 'https://accounts.spotify.com/api/token'

class SpotifyClient:        
    def __init__(self, client_id, client_secret):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = self.get_auth_token()

    def get_auth_token(self):
        auth_response = requests.post(AUTH_URL, {
        'grant_type': 'client_credentials',
        'client_id': self.client_id,
            'client_secret': self.client_secret,
        })

        auth_response_data = auth_response.json()
        access_token = auth_response_data['access_token']
        return access_token

    def get_episodes(self, show_id):
        headers = {
            'Authorization': 'Bearer {token}'.format(token=self.access_token)
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
