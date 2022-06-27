from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view

class HomeView(master_page_view.MasterPageView):
    english_name = 'Home'
    template_name = 'home'

    def before_render(self, context, request):
        context['databases_count'] = models.Database.objects.count()
        context['banks_count'] = models.Bank.objects.count()
        context['relations_count'] = models.Relation.objects.count()
        context['views_count'] = models.View.objects.count()