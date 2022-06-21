from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from datacoreapp import master_page_view 
from datacoreapp import models
from datacoreapp import views

class SearchEngineView(master_page_view.MasterPageView):
    english_name = 'SearchEngine'
    template_name = 'search_engine'

    def before_render(self, context, request):
        context['searchviews'] = models.View.objects.all().iterator()