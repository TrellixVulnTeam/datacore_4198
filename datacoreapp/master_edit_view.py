import json
import logging
from tokenize import String
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.http import HttpResponseNotFound
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 
from . import models
from . import views
from . import forms

@method_decorator(login_required, name='dispatch')
class MasterEditView(View):
    model = None
    form = None
    english_name = ''
    param_name = ''
    
    def get(self, request):
        context = views.get_context()
        page = next((p for p in context['pages'] if p.english_name == self.english_name), None)
        page.selected = True
        en = request.GET.get('en')
        action = request.GET.get('action')
        result = render(request, '404.html', context)
        if action and action == 'add' and not en:
            entity = self.model()
            entity_form = self.form()
            context[self.param_name] = entity
            context['form'] = entity_form
            context['action'] = 'add'
            context['arabic_action'] = 'إضافة'
            self.before_render()
            result = render(request, self.param_name + '_edit.html', context)
        elif en and len(en) > 0:
            child = next((c for c in page.childs if c.english_name == en), None)
            entity = self.model.objects.filter(english_name = en).first()
            if child and entity:
                child.selected = True
                context[self.param_name] = entity
                entity_form = self.form()
                entity_form.set_entity(entity)
                context['form'] = entity_form
                context['action'] = 'edit'
                context['arabic_action'] = 'تعديل'
                self.before_render(context)
                result = render(request, self.param_name + '_edit.html', context)
        else:
            context[self.param_name + "s"] = self.model.objects.all().iterator()
            result = render(request, self.param_name + 's.html', context)
        
        page.validate()
        return result
    
    def before_render(context):
        return

    def put(self, request):
        return HttpResponse(
                json.dumps({"code": "0",
                    "message": "put method not implemented"}),
                content_type="application/json"
            )
    
    def post(self, request):
        try:
            form_data = self.form(request.POST)
            action = form_data.data['action']
            code = "0"
            message = 'تمّت العمليّة بنجاح'
            if form_data.is_valid():
                if action == 'add':
                   result = self.add(form_data.cleaned_data, request)
                   code = result[0]
                   message = result[1]
                else:
                    result = self.edit(form_data.cleaned_data, request)
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
                json.dumps({"code":  code , "message": traceback.format_exc() }),
                content_type="application/json"
            )

    def add(data, request):
        raise NotImplementedError("Please Implement this method")

    def edit(data, request):
        raise NotImplementedError("Please Implement this method")