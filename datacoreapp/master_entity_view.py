import json
import logging
from tokenize import String
import traceback
import urllib.parse

from django.forms import Form
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.http import HttpResponseNotFound
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 

from datacoreapp import master_view 
from datacoreapp import models
from datacoreapp import views

class MasterEntityView(master_view.MasterView):
    model = None
    form = None
    
    def get(self, request):
        result = super().get(request)
        if self.page_redirected:
            return result
        else:
            context = result

        page = next((p for p in context['pages'] if p.english_name == self.english_name), None)
        page.selected = True
        context['title'] = page.arabic_name
        en = request.GET.get('en')
        action = request.GET.get('action')
        result = redirect('/error/?code=404&cause=' + urllib.parse.quote('الصفحة المطلوبة غير موجودة'.encode('utf8')))
        if action and action == 'add' and not en:
            entity = self.model()
            context['entity'] = entity
            context['action'] = 'add'
            context['subtitle'] = 'جديد'
            context['arabic_action'] = 'إضافة'
            self.before_render(context, request)
            result = render(request, self.template_name + '_edit.html', context)
        elif en and len(en) > 0:
            child = next((c for c in page.childs if c.english_name == en), None)
            entity = self.model.objects.filter(english_name = en).first()
            if child and entity:
                child.selected = True
                context['entity'] = entity
                context['action'] = 'edit'
                context['subtitle'] = entity.arabic_name
                context['arabic_action'] = 'تعديل'
                self.before_render(context, request)
                result = render(request, self.template_name + '_edit.html', context)
        else:
            if self.model == models.Database or self.model == models.User:
                context[self.template_name + "s"] = self.model.objects.all()
            else:
                context[self.template_name + "s"] = self.model.objects.filter(database__english_name=request.user.current_database_name)
            context['subtitle'] = None
            self.before_render(context, request)
            result = render(request, self.template_name + 's.html', context)
        
        page.validate()
        return self.parse_response(result)
    
    def before_render(self, context, request):
        super().before_render(context,request)

    def parse_response(self, response, parser=None, content_type=None, file_name = None):
        return super().parse_response(response, parser, content_type, file_name)

    def put(self, request):
        return self.parse_response({"code": "0", "message": "put method not implemented"}, 'json')
    
    def post(self, request):
        try:
            super_result = super().post(request)
            if super_result:
                return super_result;

            form_data = Form(request.POST)
            action = form_data.data['action']
            result = None
            if form_data.is_valid():
                if action == 'add':
                   result = self.add(form_data.data, request)
                elif action == 'edit':
                    result = self.edit(form_data.data, request)
                elif action == 'delete':
                    result = self.delete(form_data.data, request)
                else:
                    result = self.parse_response({"code":  '1' , "message": 'unknown action parameter' }, 'json')
            else:
                result = self.parse_response({"code":  '1' , "message": 'الرجاء التأكد من تعبئة كل الخانات المطلوبة' }, 'json')

            return result
        except Exception as e:
            logging.error(traceback.format_exc())
            code = '1'
            return self.parse_response({"code":  code , "message": str(e) }, 'json')

    def add(self, data, request):
        raise NotImplementedError("Method 'add' not implemented!")

    def edit(self, data, request):
        raise NotImplementedError("Method 'edit' not implemented!")

    def delete(self, data, request):
        raise NotImplementedError("Method 'add' not implemented!")
