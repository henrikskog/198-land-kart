import azure.functions as func
from core.podcast198land import Podcast198LandService

import json
import logging

import sentry_sdk

sentry_sdk.init(
    dsn="https://424343626b96c91760787d2139b9d0c6@o4504113989287936.ingest.us.sentry.io/4507889685037056",
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

@app.function_name(name="HttpTrigger1")
@app.route(route="req")
def main(req):
    user = req.params.get('user')
    return f'Hello, {user}!'

@app.function_name(name="episode-poller")
@app.schedule(schedule="0 0 11 * * *",
              arg_name="mytimer",
              run_on_startup=False) 
def test_function(mytimer: func.TimerRequest) -> None:
    service = Podcast198LandService()
    service.update_github_workflow()
