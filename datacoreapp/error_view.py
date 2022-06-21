from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from datacoreapp import master_page_view 
from datacoreapp import models
from datacoreapp import views

class ErrorView(master_page_view.MasterPageView):
    english_name = 'Error'
    template_name = 'error'