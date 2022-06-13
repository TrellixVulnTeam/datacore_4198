from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from . import models
from . import views
from . import master_edit_view
from . import forms

class ViewsView(master_edit_view.MasterEditView):
    model = models.View
    form = forms.ViewForm
    english_name = 'Views'
    param_name = 'view'