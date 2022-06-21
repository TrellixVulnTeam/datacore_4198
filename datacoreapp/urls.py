from django.urls import path
from django.contrib.auth import views as auth_views
from django.urls import reverse_lazy
from datacoreapp import error_view, users_view, views
from datacoreapp import home_view
from datacoreapp import advanced_search_view
from datacoreapp import banks_view
from datacoreapp import graph_search_view
from datacoreapp import import_view
from datacoreapp import relations_view
from datacoreapp import search_engine_view
from datacoreapp import settings_view
from datacoreapp import views_view
from datacoreapp import databases_view
from datacoreapp import master_entity_view
from datacoreapp import models
from django.contrib import admin
from django.views.generic.base import RedirectView

urlpatterns = [
	path('', home_view.HomeView.as_view()),
    path('password_change/', auth_views.PasswordChangeView.as_view(success_url='home/'), name='password_change'),
	path('accounts/password_change/done/', home_view.HomeView.as_view(), name='home'),
	path('admin/', RedirectView.as_view(url=reverse_lazy('admin:index')), name="admin"),

	path('home/', home_view.HomeView.as_view(), name='home'),
	path('advanced_search/', advanced_search_view.AdvancedSearchView.as_view(), name='advanced_search'),
	path('databases/', databases_view.DatabasesView.as_view(), name='databases'),
	path('banks/', banks_view.BanksView.as_view(), name='banks'),
	path('import/', import_view.ImportView.as_view(), name='import'),
	path('relations/', relations_view.RelationsView.as_view(), name='relations'),
	path('search_engine/', search_engine_view.SearchEngineView.as_view(), name='search_engine'),
	path('settings/', settings_view.SettingsView.as_view(), name='settings'),
	path('views/', views_view.ViewsView.as_view(), name='views'),
	path('users/', users_view.UsersView.as_view(), name='users'),
	path('error/', error_view.ErrorView.as_view(), name='error'),
]

def onStartup():
	if models.User.objects.count() == 0:
		user=models.User.objects.create_user('admin', password='admin')
		user.is_superuser=True
		user.is_staff=True
		user.english_name='admin'
		user.email = 'admin@users.com'
		user.first_name = 'المدير'
		user.arabic_name = 'المدير'
		user.save()

onStartup()

