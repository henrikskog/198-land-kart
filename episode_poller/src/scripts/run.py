from dynamodb import DynamoDBHandler
import json

def main():
    db = DynamoDBHandler("podcast-198-land-table")
    episodes = json.load(open("../../../out.json"))
    total = 0
    for episode in episodes:
        if not episode['country_code_iso_a3'] == '':
            # db.store_episode(episode)
            total += 1

    print(f"Total episodes stored: {total}")
if __name__ == "__main__":
    main()