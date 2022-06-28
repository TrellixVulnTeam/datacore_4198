from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from datacoreapp.arango_agent import ArangoAgent

from datacoreapp.templatetags.datacore_tags import str2bool 
from . import models
from . import views
from django.db.models import Q
from . import master_entity_view
import json

class DatabasesView(master_entity_view.MasterEntityView):
    model = models.Database
    english_name = 'Databases'
    template_name = 'database'

    def before_render(self, context, request):
        context['has_database_in_setting'] = False
        if request.user.current_database_name and len(request.user.current_database_name) > 0:
            context['has_database_in_setting'] = True
        context['users'] = models.User.objects.filter(is_superuser=False)
        context['has_databases'] = (models.Database.objects.count() > 0)

    def add(self, data, request):
        if not data['english_name'] or not data['arabic_name']:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')

        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name'])).first()

        if oldEntity:
            return('1', 'يوجد قاعدة بيانات بنفس الاسم، الرجاء اختيار اسم آخر')

        db = models.Database()
        db.english_name = data['english_name']
        db.arabic_name = data['arabic_name']
        
        ArangoAgent().create_database(db.english_name)

        db.save()
        if data['allowed_users'] and len(data['allowed_users'])>0:
            for df in data["allowed_users"].split(','):
                db.allowed_users.add(models.User.objects.filter(id=int(df)).first())

            db.save()

        return ('0','تمّت العمليّة بنجاح')

    def edit(self, data, request):
        if not data['english_name'] or not data['arabic_name']:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
        
        oldEntity = self.model.objects.filter(english_name = data['english_name']).first()
        if not oldEntity:
            return('1', 'لا يوجد قاعدة بيانات بنفس الاسم')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name'])).first()
        if tempentity:
            return('1', 'يوجد قاعدة بيانات بنفس الاسم العربي')

        if data['allowed_users'] and len(data['allowed_users'])>0:
            for df in data["allowed_users"].split(','):
                found = False
                for vdf in oldEntity.allowed_users.iterator():
                    if vdf.id == int(df):
                        found = True
                        break
                if not found:
                    oldEntity.allowed_users.add(models.User.objects.filter(id=int(df)).first())

        for vdf in oldEntity.allowed_users.iterator():
            found = False
            if data['allowed_users'] and len(data['allowed_users'])>0:
                for df in data["allowed_users"].split(','):
                    if vdf.id == int(df):
                        found = True
                        break
            if not found:
                if oldEntity.english_name == vdf.current_database_name:
                    vdf.current_database_name = ''
                    vdf.save()
                oldEntity.allowed_users.remove(vdf)

        oldEntity.arabic_name = data['arabic_name']
        oldEntity.save()

        return ('0','تمّت العمليّة بنجاح')

    def delete(self, data, request):
        oldEntity = self.model.objects.filter(english_name = data['entityid']).first()
        if not oldEntity:
            return('1', 'لا يوجد قاعدة بيانات بنفس الاسم')

        ArangoAgent().delete_database(oldEntity.english_name)

        for user in models.User.objects.all():
            if user.current_database_name == oldEntity.english_name:
                user.current_database_name = ''
                user.save()

        oldEntity.delete()

        return ('0','تمّت العمليّة بنجاح')

   