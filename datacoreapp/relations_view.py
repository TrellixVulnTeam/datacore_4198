from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from . import models
from . import views
from . import master_edit_view
from . import forms

class RelationsView(master_edit_view.MasterEditView):
    model = models.Relation
    form = forms.RelationForm
    english_name = 'Relations'
    param_name = 'relation'