from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from . import models
from . import views
from . import master_edit_view

class ViewsView(master_edit_view.MasterEditView):
    model = models.View
    english_name = 'Views'
    param_name = 'view'