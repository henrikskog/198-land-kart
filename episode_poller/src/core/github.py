import requests
import base64
import json
import logging


class GithubClient:
    def __init__(self, token, github_owner, github_repo):
        self.access_token = token
        self.github_owner = github_owner
        self.github_repo = github_repo

    def get_file(self, filename) -> str:
        # URL for the GitHub API endpoint
        url = f"https://api.github.com/repos/{self.github_owner}/{self.github_repo}/contents/{filename}"

        # Get the file content using the GitHub API
        response = requests.get(
            url, headers={"Authorization": f"token {self.access_token}"}
        )

        # Check the response
        if response.status_code == 200:
            content_base64 = response.json()["content"]
            content_bytes = base64.b64decode(content_base64)

            # return text
            return content_bytes.decode("utf-8")
        else:
            logging.error("Error getting github file:", response.json())
            return None

    def write_file(self, filename, content, commit_msg):
        # Convert the JSON content to a string and encode it in base64
        new_content_bytes = content.encode("utf-8")
        new_content_base64 = base64.b64encode(new_content_bytes).decode("utf-8")

        # URL for the GitHub API endpoint
        url = f"https://api.github.com/repos/{self.github_owner}/{self.github_repo}/contents/{filename}"

        # Get the current SHA of the file (required for updating the file)
        response = requests.get(
            url, headers={"Authorization": f"token {self.access_token}"}
        )
        current_sha = response.json()["sha"]

        # Prepare the data for the update request
        data = {
            "message": commit_msg,
            "content": new_content_base64,
            "sha": current_sha,  # Include the current SHA to update the file
        }

        # Update the file using the GitHub API
        response = requests.put(
            url, headers={"Authorization": f"token {self.access_token}"}, json=data
        )

        # Check the response
        if response.status_code == 200:
            logging.info("Github file updated successfully")
        else:
            logging.error("Error updating github file:", response.text)

    # Not used but keeping to remember that you may need to handle creating a file that does not exist yet
    def create_file(self, filename, new):
        # Convert the JSON content to a string and encode it in base64
        new_content_str = json.dumps(new, indent=4)
        new_content_bytes = new_content_str.encode("utf-8")
        new_content_base64 = base64.b64encode(new_content_bytes).decode("utf-8")

        # URL for the GitHub API endpoint
        url = f"https://api.github.com/repos/{self.github_owner}/{self.github_repo}/contents/{filename}"

        # Prepare the data for the create request
        data = {"message": "Create JSON file", "content": new_content_base64}

        # Create the file using the GitHub API
        response = requests.put(
            url, headers={"Authorization": f"token {self.access_token}"}, json=data
        )

        # Check the response
        if response.status_code == 201:
            logging.info("Github file created successfully")
        else:
            logging.error("Error creating github file:", response.json())
