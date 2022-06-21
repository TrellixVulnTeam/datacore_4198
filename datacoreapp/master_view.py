from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View 
from datacoreapp import models

@method_decorator(login_required, name='dispatch')
class MasterView(View):
    english_name = ''
    template_name = ''

    def master_check(self, entity, context, request):
        if not request.user.is_superuser:
            if not request.user.user_permissions or request.path.split('/')[1] not in request.user.user_permissions.split(','):
                return '/error/?code=403&cause=%D9%84%D9%8A%D8%B3%20%D9%84%D8%AF%D9%8A%D9%83%20%D8%B5%D9%84%D8%A7%D8%AD%D9%8A%D9%91%D8%A9%20%D9%84%D9%84%D9%85%D8%AA%D8%A7%D8%A8%D8%B9%D8%A9'

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