"""
Unit tests for Dashboard and AI endpoints.
"""


def test_dashboard_unauthorized(client):
    response = client.get('/api/v1/dashboard/summary')
    assert response.status_code == 401


def test_dashboard_summary_with_token(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'} if admin_token else {}
    response = client.get('/api/v1/dashboard/summary', headers=headers)
    if admin_token:
        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'total_warehouses' in data
        assert 'total_products' in data
        assert 'ai_recommendations' in data


def test_ai_forecast_with_token(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'} if admin_token else {}
    response = client.get('/api/v1/ai/forecast', headers=headers)
    if admin_token:
        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'forecasts' in data


def test_ai_festival_demand_with_token(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'} if admin_token else {}
    response = client.get('/api/v1/ai/festival-demand?festival=Diwali&category=Electronics', headers=headers)
    if admin_token:
        assert response.status_code == 200
        data = response.get_json()['data']
        assert data['festival'] == 'Diwali'
        assert 'demand_lift_multiplier' in data
