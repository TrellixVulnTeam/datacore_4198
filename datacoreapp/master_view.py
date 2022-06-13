from django.shortcuts import render
from django.http import HttpResponse

from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 
from . import models
from . import views
from . import master_view

@method_decorator(login_required, name='dispatch')
class MasterView(View):
    english_name = ''
    template_name = ''
    def get(self, request):
        context = views.get_context()
        page = next((p for p in context['pages'] if p.english_name == self.english_name), None)
        page.selected = True
        return render(request, self.template_name + '.html', context)