import json
from dataclasses import dataclass
from typing import Dict, List
import sys

@dataclass
class Episode:
    country_code: str
    episode_id: str
    country_name: str
    description: str
    name: str
    release_date: str
    duration_ms: int
    external_url: str
    html_description: str

def convert_to_episode_format(input_data: Dict[str, List]) -> List[Dict]:
    """
    Convert the input JSON format to a list of Episode-compatible dictionaries
    """
    episodes = []
    
    for country_code, country_episodes in input_data.items():
        for episode_data in country_episodes:
            # Extract the episode info from the nested structure
            ep = episode_data['ep']
            
            # Create a dictionary matching the Episode dataclass structure
            episode_dict = {
                'country_code_iso_a3': country_code,
                'country_name': episode_data['country'],
                'episode': {
                'episode_id': ep['id'],
                'description': ep['description'],
                'name': ep['name'],
                'release_date': ep['release_date'],
                'duration_ms': ep['duration_ms'],
                'external_url': ep['external_urls']['spotify'],
                'html_description': ep['html_description']
                }
            }
            episodes.append(episode_dict)
    
    return episodes

def main():
    if len(sys.argv) != 3:
        print("Usage: python script.py input_file.json output_file.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        # Read input JSON
        with open(input_file, 'r', encoding='utf-8') as f:
            input_data = json.load(f)

        # Convert to new format
        converted_episodes = convert_to_episode_format(input_data)

        # Write output JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(converted_episodes, f, ensure_ascii=False, indent=2)

        print(f"Successfully converted {len(converted_episodes)} episodes to {output_file}")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 