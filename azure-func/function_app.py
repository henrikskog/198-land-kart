import azure.functions as func
from helpers.spotify import get_198_land_episodes
from helpers.github import overwrite_github_file, get_github_file
from helpers.gpt import extract_country
from helpers.config import Config

import json
import logging

RAW_EPISODES_PATH = "raw_episodes.json"
BY_COUNTRY_PATH = "episodes_by_country.json"

app = func.FunctionApp()

logging.basicConfig(level=logging.INFO)

def get_old_raw():
    github_str = get_github_file(RAW_EPISODES_PATH)
    return json.loads(github_str)

def get_old_by_country():
    github_str = get_github_file(BY_COUNTRY_PATH)
    return json.loads(github_str)

def check_new_episodes():
    episodes = get_198_land_episodes()

    stored_episodes = get_old_raw()

    if len(episodes) == len(stored_episodes):
        return episodes, []

    new_episodes = episodes[:len(episodes) - len(stored_episodes)]

    return episodes, new_episodes


def update_episodes_by_country(new_episodes: list) -> None:
    by_country = get_old_by_country()

    # TODO: write backups

    for episode in new_episodes:
        country, cc = extract_country(episode["name"], episode["description"])

        if country == None or cc == None:
            logging.info("Could not extract country from episode" + episode["name"])
            continue

        new = {
            "country": country,
            "ep": episode
        }

        logging.info("New episode from " + country + " (" + cc + "): " + episode["name"])

        if cc in by_country:
            for e in by_country[cc]:
                if e["ep"]["name"] == new["ep"]["name"]:
                    logging.info("Episode already exists in list. Exiting.")
                    return None

            by_country[cc].append(new)
        else:
            by_country[cc] = [new] 

    return by_country

def update_github_workflow():
    logging.info("Checking for new episodes...")
    episodes, new_episodes = check_new_episodes()

    if len(new_episodes) == 0:
        logging.info("No new episodes found.")
        return

    logging.info("Found " + str(len(new_episodes)) + " new episodes.")
    logging.info("Updating episodes.json...")


    logging.info("Updating episodes_by_country.json...")

    by_country = update_episodes_by_country(new_episodes)

    if by_country == None: # Meaning we found a duplicate
        logging.info("Duplicate found. Exiting and not writing to github.")
        return

    overwrite_github_file(RAW_EPISODES_PATH, episodes)
    overwrite_github_file(BY_COUNTRY_PATH, by_country)

    logging.info("Done.")

@app.function_name(name="HttpTrigger1")
@app.route(route="req")
def main(req):
    user = req.params.get('user')
    return f'Hello, {user}!'

@app.function_name(name="episode-poller")
@app.schedule(schedule="0 0 11 * * *",
              arg_name="mytimer",
              run_on_startup=True) 
def test_function(mytimer: func.TimerRequest) -> None:
    update_github_workflow()