from app.services.dashboard_service import DashboardService
from app.utils.response import success_response


class DashboardController:
    def __init__(self, dashboard_service=None):
        self.dashboard_service = dashboard_service or DashboardService()

    def summary(self):
        return success_response(self.dashboard_service.get_summary(), 'Dashboard summary loaded', 200)
