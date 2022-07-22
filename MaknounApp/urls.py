import os
import shutil
from django.urls import path
from django.contrib.auth import views as auth_views
from django.urls import reverse_lazy
from Maknoun import settings
from MaknounApp import download_view, error_view, file_picker_view, users_view, views
from MaknounApp import home_view
from MaknounApp import advanced_search_view
from MaknounApp import banks_view
from MaknounApp import graph_search_view
from MaknounApp import import_view
from MaknounApp import relations_view
from MaknounApp import search_engine_view
from MaknounApp import settings_view
from MaknounApp import views_view
from MaknounApp import databases_view
from MaknounApp import master_entity_view
from MaknounApp import models
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
	path('downloads/', download_view.DownloadView.as_view(), name='downloads'),
	path('filepicker/', file_picker_view.FilePickerView.as_view(), name='filepicker'),
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
	
	project_path = str(settings.BASE_DIR)
	python_path = os.path.join(project_path, 'python')
	python_zip_path = os.path.join(project_path, 'MaknounApp\\media\\keep\\python')
	if not os.path.isfile(python_zip_path + '.zip'):
		print('creating python zip package...')
		shutil.make_archive(python_zip_path, 'zip', python_path)

onStartup()

