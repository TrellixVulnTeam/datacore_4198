from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from . import models
from . import views
from . import master_view

class AdvancedSearchView(master_view.MasterView):
    english_name = 'AdvancedSearch'
    template_name = 'advanced_search'