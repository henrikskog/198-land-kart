import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def main(event, context):
    try:
        # Log the incoming event for debugging purposes
        logger.info(f'Received event: {json.dumps(event)}')

        # TODO: Add your lambda function logic here
        response = {
            'statusCode': 200,
            'body': json.dumps({'message': 'Hello from Lambda!'})
        }

        return response
    except Exception as error:
        logger.error(f'Error: {str(error)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal Server Error'})
        }
