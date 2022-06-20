import json
import logging
from tokenize import String
import traceback
from django.forms import Form
from django.shortcuts import render
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
        context = views.get_context(request)

        master_check_result = super().master_check(self.model(), context, request)
        if master_check_result:
            return render(request, master_check_result, context)

        page = next((p for p in context['pages'] if p.english_name == self.english_name), None)
        page.selected = True
        context['title'] = page.arabic_name
        en = request.GET.get('en')
        action = request.GET.get('action')
        result = render(request, '404.html', context)
        if action and action == 'add' and not en:
            entity = self.model()
            context['entity'] = entity
            context['action'] = 'add'
            context['subtitle'] = 'جديد'
            context['arabic_action'] = 'إضافة'
            brr = self.before_render(context, request)
            if brr:
                return brr
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
                brr = self.before_render(context, request)
                if brr:
                    return brr
                result = render(request, self.template_name + '_edit.html', context)
        else:
            if self.model == models.Database:
                context[self.template_name + "s"] = self.model.objects.all().iterator()
            else:
                context[self.template_name + "s"] = self.model.objects.filter(database__english_name=request.user.current_database_name).iterator()
            context['subtitle'] = None
            result = render(request, self.template_name + 's.html', context)
        
        page.validate()
        return result
    
    def before_render(self, context, request):
        pass

    def put(self, request):
        return HttpResponse(
                json.dumps({"code": "0",
                    "message": "put method not implemented"}),
                content_type="application/json"
            )
    
    def post(self, request):
        try:
            form_data = Form(request.POST)
            action = form_data.data['action']
            code = "0"
            message = 'تمّت العمليّة بنجاح'
            if form_data.is_valid():
                if action == 'add':
                   result = self.add(form_data.data, request)
                   code = result[0]
                   message = result[1]
                elif action == 'edit':
                    result = self.edit(form_data.data, request)
                    code = result[0]
                    message = result[1]
                elif action == 'delete':
                    result = self.delete(form_data.data, request)
                    code = result[0]
                    message = result[1]
                else:
                    code = '1'
                    message = 'unknown action parameter'
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
                json.dumps({"code":  code , "message": traceback.format_exc() }),
                content_type="application/json"
            )

    def add(data, request):
        raise NotImplementedError("Method 'add' not implemented!")

    def edit(data, request):
        raise NotImplementedError("Method 'edit' not implemented!")

    def delete(data, request):
        raise NotImplementedError("Method 'add' not implemented!")
