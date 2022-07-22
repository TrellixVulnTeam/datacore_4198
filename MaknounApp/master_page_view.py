import json
import logging
import traceback
from django.shortcuts import redirect, render
from django.http import HttpResponse
import urllib.parse

from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.forms import Form

from MaknounApp import master_view 
from MaknounApp import models
from MaknounApp import views
from MaknounApp import master_page_view

class MasterPageView(master_view.MasterView):
    def get(self, request):
        result = super().get(request)
        if self.page_redirected:
            return result
        else:
            context = result
        
        if not self.template_name == 'error':
            page = next((p for p in context['pages'] if p.english_name == self.english_name), None)
            page.selected = True
            context['title'] = page.arabic_name
            context['subtitle'] = None
        else:
            context['title'] = 'خطأ'
            context['code'] = request.GET.get('code')
            context['cause'] = request.GET.get('cause')

        return self.parse_response(render(request, self.template_name + '.html', context))
    
    def before_render(self, context, request):
        super().before_render(context, request)

    def parse_response(self, response, parser=None, content_type=None, file_name = None):
        return super().parse_response(response, parser, content_type, file_name)

    def post(self, request):
        try:
            super_result = super().post(request)
            if super_result:
                return super_result;
            
            form_data = Form(request.POST)
            result = None
            if form_data.is_valid():
                result = self.post_recieved(form_data.data, request)
            else:
                result = self.parse_response({"code":  '1' , "message": 'الرجاء التأكد من تعبئة كل الخانات المطلوبة' }, 'json')

            return result
        except Exception as e:
            logging.error(traceback.format_exc())
            code = '1'
            return self.parse_response({"code":  code , "message": str(e) }, 'json')

    def post_recieved(self, data, request):
        return self.parse_response({"code":  '1' , "message": 'method not implemented \'post_recieved\'' }, 'json')