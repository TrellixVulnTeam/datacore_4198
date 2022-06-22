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

from datacoreapp import master_view 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view

class MasterPageView(master_view.MasterView):
    def get(self, request):
        context = views.get_context(request)
        self.before_render(context, request)

        master_check_result = super().master_check(None, context, request)
        if master_check_result and not request.path.startswith('/'+master_check_result.split('/')[1]) and not request.path.startswith('/error'):
            return redirect(master_check_result)
        
        if not super().user_has_permission(None,context, request) and not request.path.startswith('/error'):
            return redirect('/error/?code=403&cause=' + urllib.parse.quote('ليس لديك صلاحيّة للمتابعة'.encode('utf8')))

        if not self.template_name == 'error':
            page = next((p for p in context['pages'] if p.english_name == self.english_name), None)
            page.selected = True
            context['title'] = page.arabic_name
            context['subtitle'] = None
        else:
            context['title'] = 'خطأ'
            context['code'] = request.GET.get('code')
            context['cause'] = request.GET.get('cause')

        return render(request, self.template_name + '.html', context)
    
    def before_render(self, context, request):
        pass

    def post(self, request):
        try:
            super_result = super().post(request)
            if super_result:
                return super_result;
            
            form_data = Form(request.POST)
            code = "0"
            message = 'تمّت العمليّة بنجاح'
            if form_data.is_valid():
                result = self.post_recieved(form_data.data, request)
                code = result[0]
                message = result[1]
            else:
                code = '1'
                message = 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'

            return HttpResponse(
                json.dumps({"code":  code , "message": message }),
                content_type="application/json"
            )
        except Exception as e:
            logging.error(traceback.format_exc())
            code = '1'
            return HttpResponse(
                json.dumps({"code":  code , "message": str(e) }),
                content_type="application/json"
            )

    def post_recieved(data, request):
        raise NotImplementedError("Method 'add' not implemented!")