from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from . import master_view 
from . import models
from . import views

class SearchEngineView(master_view.MasterView):
    english_name = 'SearchEngine'
    template_name = 'search_engine'
    def get(self, request):
        context = views.get_context()
        page = next((p for p in context['pages'] if p.english_name == 'SearchEngine'), None)
        page.selected = True
        searchviews = models.View.objects.all()
        context['searchviews'] = searchviews.iterator()
        return render(request, 'search_engine.html', context)