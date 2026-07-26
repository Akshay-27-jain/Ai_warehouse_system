"""
Unit tests for Auth endpoints.
"""


def test_login_invalid_credentials(client):
    response = client.post('/api/v1/auth/login', json={
        'username': 'nonexistent_user',
        'password': 'WrongPassword123'
    })
    assert response.status_code in (400, 401)


def test_login_admin_success(client):
    response = client.post('/api/v1/auth/login', json={
        'username': 'admin',
        'password': 'Admin@12345'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'data' in json_data or 'token' in json_data
