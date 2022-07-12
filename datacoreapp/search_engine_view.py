import json
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
import logging
from datacoreapp import master_page_view 
from datacoreapp import models
from datacoreapp import views
from datacoreapp.arango_agent import ArangoAgent

class SearchEngineView(master_page_view.MasterPageView):
    english_name = 'SearchEngine'
    template_name = 'search_engine'

    def before_render(self, context, request):
        context['searchviews'] = models.View.objects.all().iterator()

    def post_recieved(self, data, request):
        try:
            if not data['query_string'] or len(data['query_string'])==0 or not data['query_fields'] or len(data['query_fields'])==0:
                return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'), 'json')

            db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
            if not db:
                return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')
            
            result = ArangoAgent(db.english_name).full_text_search(data['query_fields'].split(','),data['query_string'])

            sources = {}
            data_fields = {}
            for b in models.Bank.objects.all().iterator():
                sources[b.english_name] = {'name':b.arabic_name,'icon':b.icon_class}
            for r in models.Relation.objects.all().iterator():
                sources[r.english_name] = {'name':r.arabic_name,'icon':'bi-diagram-3-fill'}
            for f in models.DataField.objects.all().iterator():
                data_fields[f.english_name] = f.arabic_name

            result['srouces'] = {}
            for row in result['data']:
                for fname in row.keys():
                    src_name = row['_id'].split('/')[0][4:]
                    if src_name not in result['srouces']:
                        result['srouces'][src_name] = {'icon':sources[src_name]['icon'], 'ar_name': sources[src_name]['name'], 'columns': [], 'data': []}
                    if fname not in result['srouces'][src_name]['columns']:
                        if fname != '_key' and fname != '_rev':
                            result['srouces'][src_name]['columns'].append(fname)
            
            for row in result['data']:
                formated_row = []
                src_name = row['_id'].split('/')[0][4:]
                for column in result['srouces'][src_name]['columns']:
                    if column in row.keys():
                        formated_row.append(row[column])
                    else:
                        formated_row.append(None)
                result['srouces'][src_name]['data'].append(formated_row)
            
            for src in result['srouces'].values():
                for index, col in enumerate(src['columns'], start=0):
                    if col[2:] in data_fields.keys():
                        src['columns'][index] = data_fields[col[2:]]

            del result['data']
            return super().parse_response(('0',json.dumps(result)),'json')
        except Exception as e:
            logging.error(traceback.format_exc())
            return super().parse_response(('1' , str(e)),'json')
