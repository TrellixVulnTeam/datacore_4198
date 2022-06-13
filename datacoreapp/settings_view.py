from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from . import master_view 
from . import models
from . import views

class SettingsView(master_view.MasterView):
    english_name = 'Settings'
    template_name = 'settings'