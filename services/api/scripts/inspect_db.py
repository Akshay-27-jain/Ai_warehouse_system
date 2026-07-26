import sys
import os
from pathlib import Path

sys.path.insert(0, os.getcwd())

from app.config.settings import settings
from app.extensions import db
from app import create_app


def print_tables():
    app = create_app()
    with app.app_context():
        inspector = db.inspect(db.engine)
        print('Database URL:', app.config['SQLALCHEMY_DATABASE_URI'])
        print('Tables:')
        for table_name in inspector.get_table_names():
            print('-', table_name)


def query_user(identifier):
    app = create_app()
    with app.app_context():
        query = db.session.execute(
            "SELECT id, username, email, first_name, last_name, is_active, email_verified "
            "FROM users WHERE username = :identifier OR email = :identifier",
            {'identifier': identifier},
        )
        rows = query.fetchall()
        if not rows:
            print('No users found for', identifier)
            return
        for row in rows:
            print(dict(row))


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Inspect the API Postgres database')
    parser.add_argument('--tables', action='store_true', help='List all tables')
    parser.add_argument('--user', help='Query a user by username or email')
    args = parser.parse_args()

    if args.tables:
        print_tables()
    elif args.user:
        query_user(args.user)
    else:
        parser.print_help()
