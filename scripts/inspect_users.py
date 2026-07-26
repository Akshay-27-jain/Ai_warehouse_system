import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'instance', 'app.db')
print('DB path:', db_path)
if not os.path.exists(db_path):
    print('DB not found')
    exit(1)
conn = sqlite3.connect(db_path)
cur = conn.cursor()
try:
    cur.execute('SELECT id, username, email, password_hash, first_name, last_name, is_active FROM users')
    rows = cur.fetchall()
    print('Users:')
    for r in rows:
        print(r)
except Exception as e:
    print('Error querying users:', e)
finally:
    conn.close()
