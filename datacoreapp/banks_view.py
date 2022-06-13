from cgitb import reset
import json
import logging
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.http import HttpResponseNotFound
from django.views import View 
from django.core import serializers
from . import models
from . import master_edit_view
from . import forms

class BanksView(master_edit_view.MasterEditView):
    model = models.Bank
    form = forms.BankForm
    english_name = 'Banks'
    param_name = 'bank'

    def before_render(self, context):
        if context['action'] == 'edit':
            context['data_fields_json'] = []
            for f in context['bank'].data_fields.all():
                context['data_fields_json'].append(f.toJSON())

    def add(self, data, request):
        oldEntity = self.model.objects.filter(english_name = data['english_name'], arabic_name = data['arabic_name']).first()
        bank = models.Bank()
        bank.english_name = data['english_name']
        bank.arabic_name = data['arabic_name']
        bank.description = data['description']
        bank.icon_class = data["icon_class"]
        if oldEntity:
            return('1', 'يوجد بنك بنفس الاسم، الرجاء اختيار اسم آخر')
        elif data['data_fields']:
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                if f["english_name"] and f["arabic_name"] and len(f["english_name"])>0 and len(f["arabic_name"])>0:
                    for df in bank.data_fields.all():
                        if df.english_name == f["english_name"] or df.arabic_name == f["arabic_name"]:
                            return('1', 'لا يمكن وجود حقلين بنفس الاسم')
                    
                    tempdf = models.DataField()
                    tempdf.english_name = f["english_name"]
                    tempdf.arabic_name = f["arabic_name"]
                    tempdf.date_type = f["date_type"]
                    bank.data_fields.add(tempdf, bulk=False)
                else:
                    return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
                    break

        bank.save()
        
        return ('0', 'تمّت العمليّة بنجاح')
