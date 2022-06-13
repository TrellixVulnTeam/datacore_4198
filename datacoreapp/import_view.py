from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from . import models
from . import views
from . import master_view

class ImportView(master_view.MasterView):
    english_name = 'Import'
    template_name = 'import'