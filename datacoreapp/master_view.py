import json
import logging
import traceback
from django.contrib.auth.decorators import login_required
from django.forms import Form
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View 
from datacoreapp import models, views

@method_decorator(login_required, name='dispatch')
class MasterView(View):
    english_name = ''
    template_name = ''

    def master_check(self, entity, context, request):
        if models.Database.objects.count() == 0 and not request.path.startswith('/users'):
            context['entity'] = entity
            context['action'] = 'add'
            context['subtitle'] = 'جديد'
            context['arabic_action'] = 'إضافة'
            page = next((p for p in context['pages'] if p.english_name == 'Databases'), None)
            page.selected = True
            context['title'] = page.arabic_name
            return '/databases/?action=add'
        
        if self.template_name != 'database' and not request.path.startswith('/users'):
            if models.Database.objects.filter(english_name=request.user.current_database_name).count() == 0:
                request.user.current_database_name = None
                currentuser = models.User.objects.filter(id=request.user.id).first()
                currentuser.current_database_name = None
                currentuser.save()
                page = next((p for p in context['pages'] if p.english_name == 'Settings'), None)
                page.selected = True
                context['title'] = page.arabic_name
                context['subtitle'] = None
                return '/settings/'
                
        return None
    
    def user_has_permission(self, entity, context, request):
        if not request.user.is_superuser:
            if not request.user.user_permissions or request.path.split('/')[1].lower() not in request.user.user_permissions.split(','):
                return False
        return True

    def post(self, request):
        try:
            form_data = Form(request.POST)
            action = form_data.data['action']
            code = "0"
            message = 'تمّت العمليّة بنجاح'
            if form_data.is_valid():
                if action == 'change_password':
                    if not form_data.data['new_password'] or not form_data.data['confirm_password']:
                        code = "1"
                        message = 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'
                    elif form_data.data['new_password'] != form_data.data['confirm_password']:
                        code = "1"
                        message = 'كلمة المرور غير مطابقة'
                    elif len(form_data.data['new_password'].strip())<6:
                        code = "1"
                        message = 'الرجاء استعمال كلمة مرور من ستة خانات على الأقل'
                    else:
                        userid = 0
                        if form_data.data['userid']:
                            if not request.user.is_superuser:
                                code = "1"
                                message = 'ليس لديك صلاحيّة لهذه العمليّة'
                            else:
                                userid = int(form_data.data['userid'])
                        else:
                            userid= request.user.id

                        if code == '0':
                            user = models.User.objects.get(id=userid)
                            if not user:
                                code = "1"
                                message = 'لا يوجد مستخدم بهذا المعرّف'
                            else:
                                user.set_password(form_data.data['new_password'])
                                user.save()
                else:
                    return None
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