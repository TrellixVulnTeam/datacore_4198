import json
import logging
import sys
import importlib.util
import os, shutil
import time
from operator import truediv
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.views import View 
from MaknounApp import arango_agent, models
from MaknounApp import views
from MaknounApp import master_page_view
from MaknounApp.templatetags import custom_tags

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
            field = ['1', 'edge_' + r.english_name, r.arabic_name, 'bi-diagram-3-fill', 'f_edge_' + r.english_name + '_' + f.english_name, f.arabic_name, f.data_type, custom_tags.to_arabic_data_type(f.data_type), custom_tags.equals(f.data_type.lower(),'date'), self.edge_index]
            fields.append(field)
        fields += self.get_bank_fields(r.to_bank)
        return fields

    def get_bank_fields(self, b):
        fields = []
        self.col_index += 1
        for f in b.data_fields.all().iterator():
            field = ['0', 'col_' + b.english_name, b.arabic_name, b.icon_class, 'f_col_' + b.english_name + '_'  + f.english_name, f.arabic_name, f.data_type, custom_tags.to_arabic_data_type(f.data_type), custom_tags.equals(f.data_type.lower(),'date'),self.col_index]
            fields.append(field)
        return fields


    def post_recieved(self, data, request):
        if not data['meta'] or len(data['meta'])==0:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'), 'json')
        
        fileName = None
        temp_folder = os.path.dirname(os.path.realpath(__file__)) + '\\media\\temp\\'

        try:
            json_meta = json.loads(data['meta'])
            context = {'CONFIG' : json.dumps(json_meta, indent=4, sort_keys=False).replace('true','True').replace('false','False')}
            connectioninfo = arango_agent.ArangoAgent().connection_info
            context['arango_host'] = connectioninfo['host']
            context['arango_username'] = connectioninfo['username']
            context['arango_password'] = connectioninfo['password']
            context['arango_database'] = request.user.current_database_name
            context['is_on_server'] = True
            if data['where'] == 'client':
                 context['is_on_server'] = False   
            pycontent = render(request, 'import_template.py',context).content
            pycontent = pycontent.decode("utf-8").replace('EMPTY_CURLY_BRACES','{}')

            if data['where'] == 'client':
                context['pycode'] = pycontent
                batcontent = render(request, 'import_template.bat',context).content
                fileName = 'importer_' + str(time.time_ns()) + '.bat'
                downloads_folder = os.path.dirname(os.path.realpath(__file__)) + '\\media\\downloads\\'
                f = open(downloads_folder + fileName, 'x', encoding="utf-8")
                f.write(batcontent.decode("utf-8"))
                f.close()
                return super().parse_response(f'/downloads/?id={fileName}','plain')
            else:
                fileName = 'importer_' + str(time.time_ns())
                f = open(temp_folder + fileName + '.py', 'x', encoding="utf-8")
                f.write(pycontent)
                f.close()
                sys.path.append(temp_folder)
                spec = importlib.util.spec_from_file_location(f'{fileName}.Importer', temp_folder + fileName + '.py')
                module = importlib.util.module_from_spec(spec)
                sys.modules[f'{fileName}.Importer'] = module
                spec.loader.exec_module(module)
                status, logs = module.Importer().start_import()
                os.remove(temp_folder + fileName + '.py')
                if status == '1':
                    return super().parse_response((status , 'فشلت عملية الاستيراد', logs),'json')
                else:
                    return super().parse_response((status , 'تمت العمليّة بنجاح', logs),'json')
        except Exception as e:
            if data['where'] != 'client' and fileName!=None:
                os.remove(temp_folder + fileName + '.py')
            logging.error(traceback.format_exc())
            return super().parse_response(('1' , str(e)),'json')