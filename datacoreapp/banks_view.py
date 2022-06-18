from cgitb import reset
from django.contrib.contenttypes.models import ContentType
import json
import logging
from pickle import FALSE
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.http import HttpResponseNotFound
from django.views import View 
from django.core import serializers
from datacoreapp import views
from django.db.models import Q
from datacoreapp.templatetags.datacore_tags import str2bool
from . import models
from . import master_edit_view

class BanksView(master_edit_view.MasterEditView):
    model = models.Bank
    english_name = 'Banks'
    param_name = 'bank'

    def before_render(self, context):
        context['icons_list'] = views.get_icons_list()

    def add(self, data, request):
        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name'])).first()

        if oldEntity:
            return('1', 'يوجد بنك بنفس الاسم، الرجاء اختيار اسم آخر')

        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])

            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
                countf = 0
                for f2 in jsonarray:
                    if f["english_name"] == f2["english_name"] or f["arabic_name"] == f2["arabic_name"]:
                        countf+=1
                if countf > 1:
                    return('1', 'لا يمكن وجود حقلين بنفس الاسم')

        bank = models.Bank()
        bank.english_name = data['english_name']
        bank.arabic_name = data['arabic_name']
        bank.description = data['description']
        bank.icon_class = data["icon_class"]        
        #add arango bank here#

        #--------------------#
        bank.save()

        if data['data_fields']:
            content_type = ContentType.objects.get(app_label='datacoreapp', model='bank')
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                tempdf = models.DataField(content_type=content_type, object_id=bank.id)
                tempdf.english_name = f["english_name"]
                tempdf.arabic_name = f["arabic_name"]
                tempdf.data_type = f["data_type"]
                tempdf.indexed = f["indexed"]
                #add arango bank field here#

                #--------------------#
                tempdf.save()
        
        return ('0','تمّت العمليّة بنجاح')

    def edit(self, data, request):
        oldEntity = self.model.objects.filter(english_name = data['english_name']).first()
        if not oldEntity:
            return('1', 'لا يوجد بنك بنفس الاسم')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name'])).first()
        if tempentity:
            return('1', 'يوجد بنك بنفس الاسم العربي')

        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
            
            for f in jsonarray:
                fieldFound = False
                for df in oldEntity.data_fields.all():
                    if df.english_name == f["english_name"]:
                        df.arabic_name = f["arabic_name"]
                        df.data_type = f["data_type"]
                        df.indexed = f["indexed"]
                        if df.indexed != f["indexed"]:
                            #change arango field index#
                            print()
                            #--------------------#
                        df.save(force_update=True)
                        fieldFound = True
                        break
                
                if not fieldFound:
                    tempdf = models.DataField()
                    tempdf.english_name = f["english_name"]
                    tempdf.arabic_name = f["arabic_name"]
                    tempdf.data_type = f["data_type"]
                    tempdf.indexed = f["indexed"]
                    oldEntity.data_fields.add(tempdf, bulk=False)
                    #add new arango field#
                    
                    #--------------------#

            for df in oldEntity.data_fields.all():
                fieldFound = False
                for f in jsonarray:
                    if df.english_name == f["english_name"]:
                        fieldFound = True
                        break
                
                if not fieldFound:
                    oldEntity.data_fields.remove(df)
                    #delete arango field#
                                    
                    #--------------------#
        
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.description = data['description']
        oldEntity.icon_class = data["icon_class"]
        oldEntity.save(force_update=True)

        return ('0','تمّت العمليّة بنجاح')

    def delete(self, data, request):
        oldEntity = self.model.objects.filter(english_name = data['entityid']).first()
        if not oldEntity:
            return('1', 'لا يوجد بنك بنفس الاسم')
        oldEntity.delete()

        return ('0','تمّت العمليّة بنجاح')
