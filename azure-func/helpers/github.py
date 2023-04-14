import requests
import base64
import json
import logging
from helpers.config import Config

cfg = Config()

# GitHub repository and file details
owner = 'henrikskog'
repo = '198-land-kart'

file_path = 'episodes_by_country.json'

# Personal access token (PAT) with "repo" scope
access_token = cfg.github_api_key

def get_github_file(filename) -> str:
    # URL for the GitHub API endpoint
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/{filename}'
    
    # Get the file content using the GitHub API
    response = requests.get(url, headers={'Authorization': f'token {access_token}'})
    
    # Check the response
    if response.status_code == 200:
        # Decode the base64 content and parse the JSON
        content_base64 = response.json()['content']
        content_bytes = base64.b64decode(content_base64)
        content_str = content_bytes.decode('utf-8')
        return content_str
    else:
        logging.error('Error getting github file:', response.json())
        return None
    

def overwrite_github_file(filename, new, commit_msg = 'Update JSON file'):
    # Convert the JSON content to a string and encode it in base64
    new_content_str = json.dumps(new, indent=4)
    new_content_bytes = new_content_str.encode('utf-8')
    new_content_base64 = base64.b64encode(new_content_bytes).decode('utf-8')

    # URL for the GitHub API endpoint
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/{filename}'

    # Get the current SHA of the file (required for updating the file)
    response = requests.get(url, headers={'Authorization': f'token {access_token}'})
    current_sha = response.json()['sha']

    # Prepare the data for the update request
    data = {
        'message': commit_msg,
        'content': new_content_base64,
        'sha': current_sha  # Include the current SHA to update the file
    }

    # Update the file using the GitHub API
    response = requests.put(url, headers={'Authorization': f'token {access_token}'}, json=data)

    # Check the response
    if response.status_code == 200:
        logging.info('Github file updated successfully')
    else:
        logging.info('Error updating github file:', response.json())

def create_github_file(filename, new):
    # Convert the JSON content to a string and encode it in base64
    new_content_str = json.dumps(new, indent=4)
    new_content_bytes = new_content_str.encode('utf-8')
    new_content_base64 = base64.b64encode(new_content_bytes).decode('utf-8')

    # URL for the GitHub API endpoint
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/{filename}'

    # Prepare the data for the create request
    data = {
        'message': 'Create JSON file',
        'content': new_content_base64
    }

    # Create the file using the GitHub API
    response = requests.put(url, headers={'Authorization': f'token {access_token}'}, json=data)

    # Check the response
    if response.status_code == 201:
        logging.info('Github file created successfully')
    else:
        logging.error('Error creating github file:', response.json())