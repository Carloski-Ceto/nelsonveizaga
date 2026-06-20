from django.urls import path

from .views import (
    dashboard_citas_drilldown,
    dashboard_citas_drilldown_export,
    dashboard_operativo,
    dashboard_summary,
)

urlpatterns = [
    path('dashboard/summary', dashboard_summary, name='dashboard-summary'),
    path('dashboard/operativo', dashboard_operativo, name='dashboard-operativo'),
    path('dashboard/citas-drilldown', dashboard_citas_drilldown, name='dashboard-citas-drilldown'),
    path('dashboard/citas-drilldown/export', dashboard_citas_drilldown_export, name='dashboard-citas-drilldown-export'),
]
