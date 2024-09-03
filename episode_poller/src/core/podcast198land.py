import json
import logging
from core.config import Config
from core.gpt import GptClient
from core.spotify import SpotifyClient
from core.github import GithubClient

class Podcast198LandService:
    def __init__(self):
        config = Config()
        GITHUB_OWNER = 'henrikskog'
        GITHUB_REPO = '198-land-kart'
        logging.basicConfig(level=logging.INFO)


        self.BY_COUNTRY_PATH = "episodes_by_country.json"
        self.file_path = 'episodes_by_country.json'
        self.RAW_EPISODES_PATH = "raw_episodes.json"
        self.SPOTIFY_SHOW_ID = '7gVC1AP7O35An9TK6l2XpJ'
        self.github_client = GithubClient(config.github_api_key, GITHUB_OWNER, GITHUB_REPO)
        self.gpt_client = GptClient(config.openai_api_key)
        self.spotify_client = SpotifyClient(config.spotify_client_id, config.spotify_client_secret)

    @staticmethod
    def GPT_PROMPT(episode_name, episode_description):
        return f"""
        You will be given an episode of an episode of a norwegian geography podcast. 

        If the episode is not about a spesific country, please answer "no". If it is, return the name of the country in english followed by its country code according to the A3 spesification.

        EXAMPLE 1:

        Episode title:
        "Ekstramateriale: LIVE fra Akershus festning",

        Episode description:
        "I august gikk liveshowet 198 Land: Norge spesial av stabelen p\u00e5 Akershus festning i Oslo. Her kan du enten oppleve eller gjenoppleve noen h\u00f8ydepunkter fra kvelden. Produsert av Martin Oftedal, PLAN-B Hosted on Acast. See acast.com/privacy for more information.",

        Your answer:
        no

        EXAMPLE 2:

        Episode title:
        Chile del 2 med Benedicte Bull

        Episode description:
        Denne uken blir vi mer kjent med Chile og \u00e5ssen det er der, a? Vi blir kjent med gjennomsnittschileneren og deres rike matkultur, sportshistorikk og litteraturvirksomhet. Og tror du jaggumeg ikke at vi rekker \u00e5 pl\u00f8ye gjennom noen j\u00f8ss og lyttersp\u00f8rsm\u00e5l? Einar fyller den allerede tettpakkede episoden med sine mer eller mindre kvalitetssikrede fakta i tospann med professor, samfunnsviter og tidligere Chilebeboer, Benedicte Bull.Produsert av Martin Oftedal, PLAN-B  Hosted on Acast. See acast.com/privacy for more information.

        Your answer:
        Chile, CHL

        Episode title: 
        {episode_name}

        Episode description: 
        {episode_description}
        """.strip()

    def get_198_land_episodes(self):
        return self.spotify_client.get_episodes(self.SPOTIFY_SHOW_ID)

    def extract_country(self, episode_name: str, episode_description: str):
        messages = [{"role": "user", "content": self.GPT_PROMPT(episode_name, episode_description)}]

        gpt_response = self.gpt_client.chat_completion(messages)

        if gpt_response == "no":
            return None, None

        try:
            country, cc = gpt_response.split(", ")
            return country, cc
        except:
            logging.error(f"Got unexpected answer from gpt: {gpt_response} given the prompt: {self.GPT_PROMPT(episode_name, episode_description)}")
            return None, None

    def get_raw_episodes_file(self):
        github_str = self.github_client.get_file(self.RAW_EPISODES_PATH)
        return json.loads(github_str)

    def get_episodes_file_by_country(self):
        github_str = self.github_client.get_file(self.BY_COUNTRY_PATH)
        return json.loads(github_str)

    def raw_episodes_to_by_country(self, new_episodes: list) -> dict:
        by_country = self.get_episodes_file_by_country()

        for episode in new_episodes:
            country, cc = self.extract_country(episode["name"], episode["description"])

            if country == None or cc == None:
                logging.info(f"Could not extract country from episode {episode['name']}")
                continue

            new = {
                "country": country,
                "ep": episode
            }

            logging.info(f"Episode {episode['name']} got classified as {country} ({cc})")

            if cc in by_country:
                for e in by_country[cc]:
                    if e["ep"]["name"] == new["ep"]["name"]:
                        logging.warn(f"Episode {episode['name']} already exists in list. Exiting.")
                        return None

                by_country[cc].append(new)
            else:
                by_country[cc] = [new] 

        return by_country

    def process_new_episodes(self, all_episodes: list):
        logging.info("Checking for new episodes...")

        # ordered by date, newest first
        stored_episodes = self.get_raw_episodes_file()

        if len(all_episodes) == len(stored_episodes):
            logging.info("No new episodes found.")
            return

        new_episodes = all_episodes[0: len(all_episodes) - len(stored_episodes)]

        logging.info(f"Found {len(new_episodes)} new episodes.\n" + "\n".join([f"- {e['name']}" for e in new_episodes]))

        by_country = self.raw_episodes_to_by_country(new_episodes)

        if by_country == None:  # Meaning we found a duplicate
            logging.info("Duplicate found. Exiting and not writing to github.")
            return

        return by_country

    def update_github_workflow(self):
        all_episodes = self.get_198_land_episodes()
        episodes_by_country = self.process_new_episodes(all_episodes)
        self.github_client.write_file(self.RAW_EPISODES_PATH, json.dumps(all_episodes, indent=4), "Automatic update of json file with new podcast episode!")
        self.github_client.write_file(self.BY_COUNTRY_PATH, json.dumps(episodes_by_country, indent=4), "Automatic update of json file with new podcast episode!")

if __name__ == "__main__":
    service = Podcast198LandService()
    service.update_github_workflow()