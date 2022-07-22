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
from MaknounApp import views
from django.db.models import Q
from MaknounApp.arango_agent import ArangoAgent
from MaknounApp.templatetags.custom_tags import str2bool
from MaknounApp import models
from MaknounApp import master_entity_view

class BanksView(master_entity_view.MasterEntityView):
    model = models.Bank
    english_name = 'Banks'
    template_name = 'bank'

    def before_render(self, context, request):
        context['icons_list'] = views.get_icons_list()

    def add(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')

        if not data["english_name"] or not data["arabic_name"]:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')

        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name']), database__id=db.id).first()

        if oldEntity:
            return super().parse_response(('1', 'يوجد بنك بنفس الاسم، الرجاء اختيار اسم آخر'),'json')

        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
                countf = 0
                for f2 in jsonarray:
                    if f["english_name"] == f2["english_name"] or f["arabic_name"] == f2["arabic_name"]:
                        countf+=1
                if countf > 1:
                    return super().parse_response(('1', 'لا يمكن وجود حقلين بنفس الاسم'),'json')

        bank = models.Bank()
        bank.english_name = data['english_name']
        bank.arabic_name = data['arabic_name']
        bank.replication_factor = int(data['replication_factor'])
        bank.description = data['description']
        bank.icon_class = data["icon_class"]    
        bank.database = db    
        #add arango bank here#
        ArangoAgent(db.english_name).create_collection(bank.english_name,bank.replication_factor)
        #--------------------#
        bank.save()

        if data['data_fields']:
            content_type = ContentType.objects.get(app_label='MaknounApp', model='bank')
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                tempdf = models.DataField(content_type=content_type, object_id=bank.id)
                tempdf.english_name = f["english_name"]
                tempdf.arabic_name = f["arabic_name"]
                tempdf.data_type = f["data_type"]
                tempdf.indexed = f["indexed"]
                #add arango bank field here#
                if tempdf.indexed:
                    ArangoAgent(db.english_name).create_persistent_index_for_collection_field(bank.english_name, tempdf.english_name)
                #--------------------#
                tempdf.save()
        
        return  super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

    def edit(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')
        
        if not data["english_name"] or not data["arabic_name"]:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')

        oldEntity = self.model.objects.filter(english_name = data['english_name'], database__id=db.id).first()
        if not oldEntity:
            return super().parse_response(('1', 'لا يوجد بنك بنفس الاسم'),'json')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name']), database__id=db.id).first()
        if tempentity:
            return super().parse_response(('1', 'يوجد بنك بنفس الاسم العربي'),'json')

        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
            
            for f in jsonarray:
                fieldFound = False
                for df in oldEntity.data_fields.all():
                    if df.english_name == f["english_name"]:
                        df.arabic_name = f["arabic_name"]
                        df.data_type = f["data_type"]
                        df.indexed = f["indexed"]
                        #change arango field index#
                        if df.indexed:
                            ArangoAgent(db.english_name).create_persistent_index_for_collection_field(oldEntity.english_name, df.english_name)
                        else:
                            ArangoAgent(db.english_name).delete_persistent_index_for_collection_field(oldEntity.english_name, df.english_name)
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
                    if tempdf.indexed:
                        ArangoAgent(db.english_name).create_persistent_index_for_collection_field(oldEntity.english_name, tempdf.english_name)
                    #--------------------#

            for df in oldEntity.data_fields.all():
                fieldFound = False
                for f in jsonarray:
                    if df.english_name == f["english_name"]:
                        fieldFound = True
                        break
                
                if not fieldFound:
                    #delete arango field#
                    ArangoAgent(db.english_name).delete_persistent_index_for_collection_field(oldEntity.english_name, df.english_name)
                    for view in models.View.objects.all().iterator():
                        if view.data_fields:
                            for v_df in view.data_fields.all().iterator():
                                if v_df.id == df.id:
                                    ArangoAgent(db.english_name).delete_arangosearch_view_field(view.english_name, df)
                                    break
                    #--------------------#
                    oldEntity.data_fields.remove(df)
        
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.description = data['description']
        oldEntity.icon_class = data["icon_class"]
        oldEntity.replication_factor = int(data['replication_factor'])
        oldEntity.save(force_update=True)

        return super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

    def delete(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')
            
        oldEntity = self.model.objects.filter(english_name = data['entityid'], database__id=db.id).first()
        if not oldEntity:
            return super().parse_response(('1', 'لا يوجد بنك بنفس الاسم'),'json')

        if models.Relation.objects.filter(Q(from_bank = oldEntity.id) | Q(to_bank = oldEntity.id)).count() > 0:
            return super().parse_response(('1', 'يجب حذف كل العلاقات المرتبطة بهذا البنك قبل التمكن من حذفه'),'json')

        ArangoAgent(db.english_name).delete_collection(oldEntity.english_name)
        for view in models.View.objects.all().iterator():
            if view.data_fields:
                for v_df in view.data_fields.all().iterator():
                    if type(v_df.owner)==models.Bank and v_df.owner.id == oldEntity.id:
                        ArangoAgent(db.english_name).delete_arangosearch_view_collection(view.english_name, oldEntity.english_name)
                        break
        oldEntity.delete()

        return super().parse_response(('0','تمّت العمليّة بنجاح'),'json')
