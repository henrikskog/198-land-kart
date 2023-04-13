import openai
import logging
from helpers.config import Config

# Set up the OpenAI API credentials
openai.api_key = Config().openai_api_key

# Define the function
def check_predicate(text, predicate):
    # Send the text and predicate to the OpenAI GPT API to get a response
    response = openai.Completion.create(
        engine="text-davinci-002",
        prompt=f"Is the following true or false: {predicate} for {text}?",
        max_tokens=10,
        n=1,
        stop=None,
        temperature=0.5,
    )

    # Extract the answer from the response
    answer = response.choices[0].text.strip().lower()

    # Check if the predicate is true or false for the text
    if answer == "true":
        return True
    elif answer == "false":
        return False
    else:
        return None

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


# Define the function
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