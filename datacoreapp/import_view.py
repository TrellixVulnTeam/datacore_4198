import json
from operator import truediv
from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from datacoreapp import master_page_view
from datacoreapp.templatetags import datacore_tags

class ImportView(master_page_view.MasterPageView):
    english_name = 'Import'
    template_name = 'import'

    def before_render(self, context, request):
        context['banks'] = models.Bank.objects.all()
        context['relations'] = models.Relation.objects.all()
        sources = {}
        for b in models.Bank.objects.all().iterator():
            sources['collection.' + str(b.id)] = self.get_bank_fields(b)
        
        for r in models.Relation.objects.all().iterator():
            sources['edge.' + str(r.id)] = self.get_relation_fields(r)
        
        context['sources'] = json.dumps(sources)
    
    def get_relation_fields(self, r):
        fields = []
        fields += self.get_bank_fields(r.from_bank)
        for f in r.data_fields.all().iterator():
            field = ['1', 'edge_' +r.english_name, r.arabic_name, 'bi-diagram-3-fill', 'f_' + f.english_name, f.arabic_name, f.data_type, datacore_tags.to_arabic_data_type(f.data_type), datacore_tags.equals(f.data_type.lower(),'date')]
            fields.append(field)
        fields += self.get_bank_fields(r.to_bank)
        return fields

    def get_bank_fields(self, b):
        fields = []
        for f in b.data_fields.all().iterator():
            field = ['0', 'col_' + b.english_name, b.arabic_name, b.icon_class, 'f_' + f.english_name, f.arabic_name, f.data_type, datacore_tags.to_arabic_data_type(f.data_type), datacore_tags.equals(f.data_type.lower(),'date')]
            fields.append(field)
        return fields


    def post_recieved(self, data, request):
        if not data['meta'] or len(data['meta'])==0:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'), 'json')

        json_meta = json.loads(data['meta'],)
        context = {'config' : json.dumps(json_meta, indent=4, sort_keys=True)}
        return super().parse_response(render(request, 'import_template.py',context))