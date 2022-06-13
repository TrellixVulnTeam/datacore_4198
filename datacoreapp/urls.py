from django.urls import path
from django.contrib.auth import views as auth_views
from django.urls import reverse_lazy
from . import views
from . import home_view
from . import advanced_search_view
from . import banks_view
from . import graph_search_view
from . import import_view
from . import relations_view
from . import search_engine_view
from . import settings_view
from . import views_view
from . import master_edit_view
from django.contrib import admin
from django.views.generic.base import RedirectView

urlpatterns = [
	path('', home_view.HomeView.as_view()),
    path('password_change/', auth_views.PasswordChangeView.as_view(success_url='home/'), name='password_change'),
	path('accounts/password_change/done/', home_view.HomeView.as_view(), name='home'),
	path('admin/', RedirectView.as_view(url=reverse_lazy('admin:index')), name="admin"),

	path('home/', home_view.HomeView.as_view(), name='home'),
	path('advanced_search/', advanced_search_view.AdvancedSearchView.as_view(), name='advanced_search'),
	path('graph_search/', graph_search_view.GraphSearchView.as_view(), name='graph_search'),
	path('banks/', banks_view.BanksView.as_view(), name='banks'),
	path('import/', import_view.ImportView.as_view(), name='import'),
	path('relations/', relations_view.RelationsView.as_view(), name='relations'),
	path('search_engine/', search_engine_view.SearchEngineView.as_view(), name='search_engine'),
	path('settings/', settings_view.SettingsView.as_view(), name='settings'),
	path('views/', views_view.ViewsView.as_view(), name='views'),
]
