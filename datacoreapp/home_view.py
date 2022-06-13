from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 
from . import models
from . import views
from . import master_view

class HomeView(master_view.MasterView):
    english_name = 'Home'
    template_name = 'home'