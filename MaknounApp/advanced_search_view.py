import datetime
from email import iterators
import json
import time
import traceback
from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
import logging 
from MaknounApp import models
from MaknounApp import views
from MaknounApp import master_page_view
from MaknounApp.arango_agent import ArangoAgent

class AdvancedSearchView(master_page_view.MasterPageView):
    english_name = 'AdvancedSearch'
    template_name = 'advanced_search'

    def before_render(self, context, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        banks = models.Bank.objects.filter(database__id=db.id)
        context['banks'] = banks
        relations = models.Relation.objects.filter(database__id=db.id)
        context['relations'] = relations
        data = {}
        for b in banks.iterator():
            self.fill_source_data(data, b)
        for r in relations.iterator():
            self.fill_source_data(data, r)

        context['data'] = json.dumps(data)

    def fill_source_data(self, data, source):
        source_name = ''
        if type(source) is models.Bank:
           source_name = 'col_' + source.english_name
        else:
           source_name = 'edge_' + source.english_name
        data[source_name] = {}
        data[source_name]['data'] = {}
        data[source_name]['data']['filters'] = []
        data[source_name]['data']['filters'].append({'id':'_id','label':'المعرّف','type':'string','input':'text','operators':self.get_operators("String", False),'multiple':False})
        data[source_name]['data']['filters'].append({'id':'_active','label':'مفعّل','type':'boolean','input':'select','operators':self.get_operators("Bool", False),'multiple':False, 'values':{True:'نعم',False:'كلا'}})
        data[source_name]['data']['filters'].append({'id':'_creation','label':'تاريخ الإنشاء','type':'datetime','input':'text','operators':self.get_operators("Date", False),'multiple':True})
        for f in source.data_fields.all().iterator():
            field_data = {}
            field_data['id']= 'f_' + source_name + '_' + f.english_name
            field_data['label'] = f.arabic_name
            field_data['type'] = self.get_type(f.data_type)
            field_data['input'] = self.get_input(f.data_type)
            view = models.View.objects.filter(data_fields__in=[f]).first()
            if view:
                field_data['id'] = 'f_' + source_name + '_' + f.english_name + '@asview_' + view.english_name
            field_data['operators'] = self.get_operators(f.data_type, view!=None)
            field_data['multiple'] = self.is_multiple(f.data_type)
            if field_data['type'] == 'boolean':
                field_data['values'] = {True:'نعم',False:'كلا'}
            data[source_name]['data']['filters'].append(field_data)

    def get_input(self, t):
        if t.endswith('String'):
            return 'text'
        elif t.endswith('Number'):
            return 'number'
        elif t.endswith('Bool'):
            return 'select'
        elif t.endswith('Date'):
            return 'getdtpuifunc'

    def get_type(self, t):
        if t.endswith('String'):
            return 'string'
        elif t.endswith('Number'):
            return 'double'
        elif t.endswith('Bool'):
            return 'boolean'
        elif t.endswith('Date'):
            return 'datetime'
    
    def get_operators(self, t, inview):
        if t.endswith('String') and inview:
            return ['equal','not_equal','in','not_in','begins_with','not_begins_with','contains','not_contains','similar','not_similar','ends_with','not_ends_with','is_empty','is_not_empty','is_null','is_not_null','is_defined','is_not_defined']
        elif t.endswith('String') and not inview:
            return ['equal','not_equal','in','not_in','is_null','is_not_null','is_defined','is_not_defined']
        elif t.endswith('Number'):
            return ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null','is_defined','is_not_defined']
        elif t.endswith('Date'):
            return ['equal','not_equal','less','less_or_equal','greater','greater_or_equal','between','not_between','is_null','is_not_null','is_defined','is_not_defined']
        elif t.endswith('Bool'):
            return ['equal','not_equal','is_null','is_not_null','is_defined','is_not_defined']
        else:
            return ['equal','not_equal','is_null','is_not_null','is_defined','is_not_defined']

    def is_multiple(self, t):
        if not t.endswith('String'):
            return True
        return False
    
    def post_recieved(self, data, request):
        try:
            if not data['source'] or len(data['source'])==0 or not data['rules'] or len(data['rules'])==0:
                return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'), 'json')

            db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
            if not db:
                return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')
            
            source = data['source']
            rules = json.loads(data['rules'])

            arango_agent = ArangoAgent(db.english_name)
            result = arango_agent.advanced_qb_search(source,rules)
            result = arango_agent.transform_result_readable(result)
            
            return super().parse_response(('0',json.dumps(result)),'json')
        except Exception as e:
            logging.error(traceback.format_exc())
            return super().parse_response(('1' , str(e)),'json')
    