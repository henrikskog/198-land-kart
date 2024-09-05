import openai


class GptClient:
    def __init__(self, openai_api_key):
        openai.api_key = openai_api_key

    def chat_completion(self, messages):
        response = openai.ChatCompletion.create(messages=messages, model="gpt-4o-mini")

        return response.choices[0].message.content
