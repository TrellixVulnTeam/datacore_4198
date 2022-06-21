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

    def add(self, data, request):
        if not data["english_name"] or not data["arabic_name"]:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
        
        oldEntity = self.model.objects.filter(Q(username = data['english_name']) | Q(arabic_name = data['arabic_name'])).first()

        if oldEntity:
            return('1', 'يوجد مستخدم بنفس الاسم، الرجاء اختيار اسم آخر')

        user = models.User.objects.create_user(data['english_name'], password='123456789')
        user.english_name = data['english_name']
        user.first_name = data['arabic_name']
        user.arabic_name = data['arabic_name']
        user.is_superuser = str2bool(data['is_superuser'])
        user.is_staff = str2bool(data['is_superuser'])
        user.email = data['english_name'] + '@users.com'
        user.user_permissions = data["permissions"]
        user.save()

        return ('0','تمّت العمليّة بنجاح')

    def edit(self, data, request):
        if not data["english_name"] or not data["arabic_name"]:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')

        oldEntity = self.model.objects.filter(username = data['english_name']).first()
        if not oldEntity:
            return('1', 'لا يوجد مستخدم بنفس الاسم')

        if oldEntity.username == 'admin':
            return('1', 'لا يمكن تعديل مستخدم المدير')

        if oldEntity.username == request.user.username:
            return('1', 'لا يمكن تعديل المستخدم الحالي')

        tempentity = self.model.objects.filter(~Q(username = data['english_name']), Q(arabic_name = data['arabic_name'])).first()
        if tempentity:
            return('1', 'يوجد مستخدم بنفس الاسم العربي')

        oldEntity.first_name = data['arabic_name']
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.is_superuser = str2bool(data['is_superuser'])
        oldEntity.is_staff = str2bool(data['is_superuser'])
        oldEntity.user_permissions = data["permissions"]
        oldEntity.save()

        return ('0','تمّت العمليّة بنجاح')

    def delete(self, data, request):
        if data['entityid'] == 'admin':
            return('1', 'لا يمكن حذف مستخدم المدير')
        
        if data['entityid'] == request.user.username:
            return('1', 'لا يمكن حذف المستخدم الحالي')

        oldEntity = self.model.objects.filter(username = data['entityid']).first()
        if not oldEntity:
            return('1', 'لا يوجد مستخدم بنفس الاسم')
        oldEntity.delete()

        return ('0','تمّت العمليّة بنجاح')

   