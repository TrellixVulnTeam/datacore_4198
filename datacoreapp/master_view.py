from django.shortcuts import render
from django.http import HttpResponse

from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view

@method_decorator(login_required, name='dispatch')
class MasterView(View):
    english_name = ''
    template_name = ''

    def master_check(self, entity, context, request):
        if models.Database.objects.count() == 0:
            context['entity'] = entity
            context['action'] = 'add'
            context['subtitle'] = 'جديد'
            context['arabic_action'] = 'إضافة'
            page = next((p for p in context['pages'] if p.english_name == 'Databases'), None)
            page.selected = True
            context['title'] = page.arabic_name
            return 'database_edit.html'
        if self.template_name != 'database':
            if models.Database.objects.filter(english_name=request.user.current_database_name).count() == 0:
                request.user.current_database_name = None
                currentuser = models.User.objects.filter(id=request.user.id).first()
                currentuser.current_database_name = None
                currentuser.save()
                page = next((p for p in context['pages'] if p.english_name == 'Settings'), None)
                page.selected = True
                context['title'] = page.arabic_name
                context['subtitle'] = None
                return 'settings.html'
        return None