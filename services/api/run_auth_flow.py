from app import create_app
from app.services.auth_service import AuthService
import random, string

app = create_app()
with app.app_context():
    auth = AuthService()
    # create unique credentials
    suffix = ''.join(random.choice(string.ascii_lowercase+string.digits) for _ in range(6))
    username = f'test_{suffix}'
    email = f'{username}@example.com'
    password = 'TestPass123!'
    payload = {
        'username': username,
        'email': email,
        'password': password,
        'first_name': 'Test',
        'last_name': 'User'
    }
    print('Registering', username, email)
    try:
        user = auth.register(payload)
        print('Registered user id:', user.id)
    except Exception as e:
        print('Registration error:', e)

    print('Attempting login with username')
    try:
        res = auth.login(username, password)
        print('Login success, access token present:', 'access_token' in res)
    except Exception as e:
        print('Login error with username:', e)

    print('Attempting login with email')
    try:
        res = auth.login(email, password)
        print('Login success with email, access token present:', 'access_token' in res)
    except Exception as e:
        print('Login error with email:', e)
