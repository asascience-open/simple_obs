from flask import Flask

app = Flask(__name__)

app.config.from_object('simple_obs.config')

# Create logging
if app.config.get('LOG_FILE') == True:
    import logging
    from logging import FileHandler
    file_handler = FileHandler('logs/simple_obs.txt')
    file_handler.setLevel(logging.DEBUG)
    app.logger.addHandler(file_handler)

# Import everything
import simple_obs.views