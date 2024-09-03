from core.podcast198land import Podcast198LandService

import json
import logging
import traceback, sys

import sentry_sdk

sentry_sdk.init(
    dsn="https://424343626b96c91760787d2139b9d0c6@o4504113989287936.ingest.us.sentry.io/4507889685037056",
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)


logger = logging.getLogger()
logger.setLevel(logging.INFO)

def log_exception():
    exc_type, exc_value, exc_traceback = sys.exc_info()
    logging.error(''.join(traceback.format_exception(exc_type, exc_value, exc_traceback)))

def main(event, context):
    try:
        # Log the incoming event for debugging purposes
        logger.info(f'Received event: {json.dumps(event)}')

        service = Podcast198LandService()
        service.update_github_workflow()

        # TODO: Add your lambda function logic here
        response = {
            'statusCode': 200,
            'body': json.dumps({'message': 'Hello from Lambda!'})
        }

        return response
    except Exception as error:
        log_exception()
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal Server Error'})
        }

