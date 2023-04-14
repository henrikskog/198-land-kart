import openai
import logging
from helpers.config import Config

# Set up the OpenAI API credentials
openai.api_key = Config().openai_api_key

def extract_country(episode_name: str, episode_description: str):
    prompt = f"""
        You will be given an episode of an episode of a norwegian geography podcast. 

        If the episode is not about one spesific country, please answer "no". If it is, return the name of the country in english followed by its country code.

        Examples:
        Noway, NOR
        Sweden, SWE
        no

        Episode title: 
        {episode_name}

        Episode description: 
        {episode_description}
    """

    messages = [
    {"role": "user", "content": prompt}
    ]

    # Send the name to the OpenAI GPT API to get the country information
    response = openai.ChatCompletion.create(
        messages=messages,
        model="gpt-3.5-turbo"
    )

    answer = response.choices[0].message.content

    if answer == "no":
        return None

    country, cc = answer.split(", ")

    logging.info("Country: " + country + " (" + cc + ")")
    
    
    return country, cc

def get_countries_from_episodes(episodes):
    # Extract the names from each episode and put them in a list
    new = []

    # enumerate epsiodes
    for i, episode in enumerate(episodes):
        new.append({
            "ep": episode,
            "country": extract_country(episode["name"], episode["description"])
        })

    return new
