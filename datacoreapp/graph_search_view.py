from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view

class GraphSearchView(master_page_view.MasterPageView):
    english_name = 'GraphSearch'
    template_name = 'graph_search'