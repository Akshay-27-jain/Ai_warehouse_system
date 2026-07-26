import logging
import os
from logging.handlers import RotatingFileHandler


def configure_logging(app):
    log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    handler = RotatingFileHandler(os.path.join(log_dir, 'app.log'), maxBytes=5 * 1024 * 1024, backupCount=5)
    handler.setLevel(logging.INFO)
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s'))
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
