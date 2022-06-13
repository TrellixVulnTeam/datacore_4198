from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from . import models
from . import views
from . import master_view

class GraphSearchView(master_view.MasterView):
    english_name = 'GraphSearch'
    template_name = 'graph_search'