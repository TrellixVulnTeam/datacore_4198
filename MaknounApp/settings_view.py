from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from MaknounApp import master_page_view 
from MaknounApp import models
from MaknounApp import views

class SettingsView(master_page_view.MasterPageView):
    english_name = 'Settings'
    template_name = 'settings'

    def before_render(self, context, request):
        context['has_database'] = False
        if request.user.current_database_name and len(request.user.current_database_name) > 0:
            context['has_database'] = True
        context['databases'] = []
        for db in models.Database.objects.all().iterator():
            if request.user.is_superuser:
                context['databases'].append(db)
            else:
                for u in db.allowed_users.iterator():
                    if u.id == request.user.id:
                        context['databases'].append(db)
                        break
    
    def post_recieved(self, data, request):
        if not data['database'] or len(data['database'])==0:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')

        db = models.Database.objects.filter(english_name=data['database']).first()
        if not db:
            return super().parse_response(('1', 'لا يوجد قاعدة بيانات بنفس الاسم'),'json')

        currentuser = models.User.objects.filter(id=request.user.id).first()
        currentuser.current_database_name = db.english_name
        currentuser.save()
        request.user.current_database_name = db.english_name

        return super().parse_response(('0','تمّت العمليّة بنجاح'),'json')
