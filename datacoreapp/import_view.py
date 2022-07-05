import json
import os, shutil
import time
from operator import truediv
from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from datacoreapp import arango_agent, models
from datacoreapp import views
from datacoreapp import master_page_view
from datacoreapp.templatetags import datacore_tags

class ImportView(master_page_view.MasterPageView):
    english_name = 'Import'
    template_name = 'import'
    col_index = -1
    edge_index = -1
    def before_render(self, context, request):
        context['banks'] = models.Bank.objects.all()
        context['relations'] = models.Relation.objects.all()
        sources = {}
        self.col_index = -1
        self.edge_index = -1
        for b in models.Bank.objects.all().iterator():
            sources['collection.' + str(b.id)] = self.get_bank_fields(b)
        
        for r in models.Relation.objects.all().iterator():
            sources['edge.' + str(r.id)] = self.get_relation_fields(r)
        
        context['sources'] = json.dumps(sources)
    
    def get_relation_fields(self, r):
        fields = []
        self.edge_index += 1
        fields += self.get_bank_fields(r.from_bank)
        for f in r.data_fields.all().iterator():
            field = ['1', 'edge_' +r.english_name, r.arabic_name, 'bi-diagram-3-fill', 'f_' + f.english_name, f.arabic_name, f.data_type, datacore_tags.to_arabic_data_type(f.data_type), datacore_tags.equals(f.data_type.lower(),'date'), self.edge_index]
            fields.append(field)
        fields += self.get_bank_fields(r.to_bank)
        return fields

    def get_bank_fields(self, b):
        fields = []
        self.col_index += 1
        for f in b.data_fields.all().iterator():
            field = ['0', 'col_' + b.english_name, b.arabic_name, b.icon_class, 'f_' + f.english_name, f.arabic_name, f.data_type, datacore_tags.to_arabic_data_type(f.data_type), datacore_tags.equals(f.data_type.lower(),'date'),self.col_index]
            fields.append(field)
        return fields


    def post_recieved(self, data, request):
        if not data['meta'] or len(data['meta'])==0:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'), 'json')

        json_meta = json.loads(data['meta'])
        context = {'config' : json.dumps(json_meta, indent=4, sort_keys=False).replace('true','True').replace('false','False')}
        connectioninfo = arango_agent.ArangoAgent().connection_info
        context['arango_host'] = connectioninfo['host']
        context['arango_username'] = connectioninfo['username']
        context['arango_password'] = connectioninfo['password']
        context['arango_database'] = request.user.current_database_name
        pycontent = render(request, 'import_template.py',context).content
        fileName = 'importer_' + str(time.time_ns()) + '.py'

        downloads_folder = os.path.dirname(os.path.realpath(__file__)) + '\\static\\download\\'
        for filename in os.listdir(downloads_folder):
            file_path = os.path.join(downloads_folder, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print('Failed to delete %s. Reason: %s' % (file_path, e))

        f = open(downloads_folder + fileName, 'x', encoding="utf-8")
        f.write(pycontent.decode("utf-8"))
        f.close()
        return super().parse_response('/static/download/' + fileName,'plain')