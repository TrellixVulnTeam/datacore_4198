from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from MaknounApp import master_page_view 
from MaknounApp import models
from MaknounApp import views

class ErrorView(master_page_view.MasterPageView):
    english_name = 'Error'
    template_name = 'error'