from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view

class AdvancedSearchView(master_page_view.MasterPageView):
    english_name = 'AdvancedSearch'
    template_name = 'advanced_search'