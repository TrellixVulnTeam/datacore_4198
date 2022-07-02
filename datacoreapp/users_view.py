from django.shortcuts import render
from django.http import HttpResponse
from django.views import View

from datacoreapp.templatetags.datacore_tags import str2bool 
from datacoreapp import models
from datacoreapp import views
from django.db.models import Q
from datacoreapp import master_entity_view
import json

class UsersView(master_entity_view.MasterEntityView):
    model = models.User
    english_name = 'Users'
    template_name = 'user'

    def before_render(self, context, request):
        context['databases'] = models.Database.objects.all()

    def add(self, data, request):
        if not data["english_name"] or not data["arabic_name"]:
            return  super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
        
        oldEntity = self.model.objects.filter(Q(username = data['english_name']) | Q(arabic_name = data['arabic_name'])).first()

        if oldEntity:
            return  super().parse_response(('1', 'يوجد مستخدم بنفس الاسم، الرجاء اختيار اسم آخر'),'json')

        user = models.User.objects.create_user(data['english_name'], password='123456789')
        user.english_name = data['english_name']
        user.first_name = data['arabic_name']
        user.arabic_name = data['arabic_name']
        user.is_superuser = str2bool(data['is_superuser'])
        user.is_staff = str2bool(data['is_superuser'])
        user.email = data['english_name'] + '@users.com'
        user.user_permissions = data["permissions"]
        user.current_database_name = data["current_database_name"]
        user.save()

        return  super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

    def edit(self, data, request):
        if not data["english_name"] or not data["arabic_name"]:
            return  super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')

        oldEntity = self.model.objects.filter(username = data['english_name']).first()
        if not oldEntity:
            return  super().parse_response(('1', 'لا يوجد مستخدم بنفس الاسم'),'json')

        if oldEntity.username == 'admin':
            return  super().parse_response(('1', 'لا يمكن تعديل مستخدم المدير'),'json')

        if oldEntity.username == request.user.username:
            return  super().parse_response(('1', 'لا يمكن تعديل المستخدم الحالي'),'json')

        tempentity = self.model.objects.filter(~Q(username = data['english_name']), Q(arabic_name = data['arabic_name'])).first()
        if tempentity:
            return  super().parse_response(('1', 'يوجد مستخدم بنفس الاسم العربي'),'json')

        oldEntity.first_name = data['arabic_name']
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.is_superuser = str2bool(data['is_superuser'])
        oldEntity.is_staff = str2bool(data['is_superuser'])
        oldEntity.user_permissions = data["permissions"]
        oldEntity.current_database_name = data["current_database_name"]
        oldEntity.save()

        return  super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

    def delete(self, data, request):
        if data['entityid'] == 'admin':
            return  super().parse_response(('1', 'لا يمكن حذف مستخدم المدير'),'json')
        
        if data['entityid'] == request.user.username:
            return  super().parse_response(('1', 'لا يمكن حذف المستخدم الحالي'),'json')

        oldEntity = self.model.objects.filter(username = data['entityid']).first()
        if not oldEntity:
            return  super().parse_response(('1', 'لا يوجد مستخدم بنفس الاسم'),'json')
        oldEntity.delete()

        return  super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

   