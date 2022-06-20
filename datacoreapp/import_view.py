from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view

class ImportView(master_page_view.MasterPageView):
    english_name = 'Import'
    template_name = 'import'