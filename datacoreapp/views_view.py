from django.shortcuts import render
from django.http import HttpResponse
from django.views import View

from datacoreapp.templatetags.datacore_tags import str2bool 
from . import models
from . import views
from django.db.models import Q
from . import master_edit_view
import json

class ViewsView(master_edit_view.MasterEditView):
    model = models.View
    english_name = 'Views'
    param_name = 'view'

    def before_render(self, context):
        context['banks'] = models.Bank.objects.all()
        context['relations'] = models.Relation.objects.all()

    def add(self, data, request):
        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name'])).first()

        if oldEntity:
            return('1', 'يوجد ملف بنفس الاسم، الرجاء اختيار اسم آخر')

        if not data['data_fields'] or len(data['data_fields'])==0:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')

        view = models.View()
        view.english_name = data['english_name']
        view.arabic_name = data['arabic_name']
        view.compressed = str2bool(data['compressed'])
        #add arango view here#

        #--------------------#
        view.save()
        for df in data["data_fields"].split(','):
            view.data_fields.add(models.DataField.objects.filter(id=df).first())

        view.save()

        return ('0','تمّت العمليّة بنجاح')

    def edit(self, data, request):
        oldEntity = self.model.objects.filter(english_name = data['english_name']).first()
        if not oldEntity:
            return('1', 'لا يوجد ملف بنفس الاسم')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name'])).first()
        if tempentity:
            return('1', 'يوجد ملف بنفس الاسم العربي')

        if not data['data_fields'] or len(data['data_fields'])==0:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
        
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.compressed = data['compressed']
        for df in data["data_fields"].split(','):
            found = False
            for vdf in oldEntity.data_fields.iterator():
                if vdf.id == df:
                    found = True
                    break
            if not found:
                #add arango view-field here#

                #--------------------#
                oldEntity.data_fields.add(models.DataField.objects.filter(id=df).first())

        for vdf in oldEntity.data_fields.iterator():
            found = False
            for df in data["data_fields"].split(','):
                if vdf.id == df:
                    found = True
                    break
            if not found:
                #remove arango view-field here#

                #--------------------#
                oldEntity.data_fields.remove(models.DataField.objects.filter(id=df).first())

        oldEntity.arabic_name = data['arabic_name']
        oldEntity.compressed = data['compressed']
        oldEntity.save()

        return ('0','تمّت العمليّة بنجاح')

    def delete(self, data, request):
        oldEntity = self.model.objects.filter(english_name = data['entityid']).first()
        if not oldEntity:
            return('1', 'لا يوجد ملف بنفس الاسم')
        oldEntity.delete()

        return ('0','تمّت العمليّة بنجاح')

   