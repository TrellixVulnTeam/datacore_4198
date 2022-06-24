from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from datacoreapp.arango_agent import ArangoAgent

from datacoreapp.templatetags.datacore_tags import str2bool 
from datacoreapp import models
from datacoreapp import views
from django.db.models import Q
from datacoreapp import master_entity_view
import json

class ViewsView(master_entity_view.MasterEntityView):
    model = models.View
    english_name = 'Views'
    template_name = 'view'

    def before_render(self, context, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        context['banks'] = models.Bank.objects.filter(database__id=db.id)
        context['relations'] = models.Relation.objects.filter(database__id=db.id)

    def add(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة')
            
        if not data["english_name"] or not data["arabic_name"]:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
        
        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name']), database__id=db.id).first()

        if oldEntity:
            return('1', 'يوجد ملف بنفس الاسم، الرجاء اختيار اسم آخر')

        if not data['data_fields'] or len(data['data_fields'])==0:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')

        view = models.View()
        view.english_name = data['english_name']
        view.arabic_name = data['arabic_name']
        view.compressed = str2bool(data['compressed'])
        view.database = db  
        #add arango view here#
        ArangoAgent(db.english_name).create_arangosearch_view(view.english_name, view.compressed)
        #--------------------#
        view.save()
        view_fields = []
        for df in data["data_fields"].split(','):
            data_field = models.DataField.objects.filter(id=int(df)).first()
            view.data_fields.add(data_field)
            view_fields.append[data_field.owner.english_name + '.' + data_field.english_name]

        ArangoAgent(db.english_name).generate_view_links(view_fields)
        view.save()

        return ('0','تمّت العمليّة بنجاح')

    def edit(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة')
            
        if not data["english_name"] or not data["arabic_name"]:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')

        oldEntity = self.model.objects.filter(english_name = data['english_name'], database__id=db.id).first()
        if not oldEntity:
            return('1', 'لا يوجد ملف بنفس الاسم')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name']), database__id=db.id).first()
        if tempentity:
            return('1', 'يوجد ملف بنفس الاسم العربي')

        if not data['data_fields'] or len(data['data_fields'])==0:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
        
        for df in data["data_fields"].split(','):
            found = False
            for vdf in oldEntity.data_fields.iterator():
                if vdf.id == int(df):
                    found = True
                    break
            if not found:
                #add arango view-field here#

                #--------------------#
                oldEntity.data_fields.add(models.DataField.objects.filter(id=int(df)).first())

        for vdf in oldEntity.data_fields.iterator():
            found = False
            for df in data["data_fields"].split(','):
                if vdf.id == int(df):
                    found = True
                    break
            if not found:
                #remove arango view-field here#

                #--------------------#
                oldEntity.data_fields.remove(vdf)

        oldEntity.arabic_name = data['arabic_name']
        oldEntity.compressed = str2bool(data['compressed'])
        oldEntity.save()

        return ('0','تمّت العمليّة بنجاح')

    def delete(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة')
            
        oldEntity = self.model.objects.filter(english_name = data['entityid'], database__id=db.id).first()
        if not oldEntity:
            return('1', 'لا يوجد ملف بنفس الاسم')

        ArangoAgent(db.english_name).delete_arangosearch_view(oldEntity.english_name)
        oldEntity.delete()

        return ('0','تمّت العمليّة بنجاح')

   