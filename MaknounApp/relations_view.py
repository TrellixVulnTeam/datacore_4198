from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
from django.views import View 
from MaknounApp import models
from MaknounApp import views
from django.db.models import Q
from MaknounApp import master_entity_view
import json

from MaknounApp.arango_agent import ArangoAgent

class RelationsView(master_entity_view.MasterEntityView):
    model = models.Relation
    english_name = 'Relations'
    template_name = 'relation'

    def before_render(self, context, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        context['banks'] = models.Bank.objects.filter(database__id=db.id)

    def add(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')

        if not data["english_name"] or not data["arabic_name"]:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
        
        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name']), database__id=db.id).first()

        if oldEntity:
            return super().parse_response(('1', 'يوجد علاقة بنفس الاسم، الرجاء اختيار اسم آخر'),'json')

        if not data['from_bank'] or not data['to_bank']:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')

        oldEntity = self.model.objects.filter(from_bank = data['from_bank'], to_bank = data['to_bank']).first()

        if oldEntity:
            return super().parse_response(('1', 'يوجد علاقة بين هذين البنكين، الرجاء تغيير اتجاه العلاقة'),'json')

        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])

            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
                countf = 0
                for f2 in jsonarray:
                    if f["english_name"] == f2["english_name"] or f["arabic_name"] == f2["arabic_name"]:
                        countf+=1
                if countf > 1:
                    return super().parse_response(('1', 'لا يمكن وجود حقلين بنفس الاسم'),'json')

        arango_agent = ArangoAgent(db.english_name)

        from_bank  = models.Bank.objects.filter(id = data['from_bank']).first()
        to_bank  = models.Bank.objects.filter(id = data['to_bank']).first()

        relation = models.Relation()
        relation.english_name = data['english_name']
        relation.arabic_name = data['arabic_name']
        relation.from_bank = from_bank
        relation.to_bank = to_bank
        relation.database = db  
        #add arango edge here#
        arango_agent.create_grph(relation.english_name,from_col_name=from_bank.english_name, to_col_name=to_bank.english_name)
        #--------------------#
        relation.save()

        view_fields = []
        if data['data_fields']:
            content_type = ContentType.objects.get(app_label='MaknounApp', model='relation')
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                tempdf = models.DataField(content_type=content_type, object_id=relation.id)
                tempdf.english_name = f["english_name"]
                tempdf.arabic_name = f["arabic_name"]
                tempdf.data_type = f["data_type"]
                tempdf.indexed = f["indexed"]
                tempdf.owner = relation
                #add arango edge field here#
                if tempdf.indexed:
                    arango_agent.create_persistent_index_for_edge_field(relation.english_name, tempdf.english_name)
                #--------------------#
                if tempdf.data_type == 'String':
                    view_fields.append(tempdf)
                tempdf.save()

        #add arango bank here#
        view = models.View()
        view.english_name = 'edge_view_' + relation.english_name
        view.arabic_name = 'ملف_علاقة_' + relation.arabic_name
        view.compressed = False
        view.database = db  
        view.save()
        view.data_fields.set(view_fields)
        view.save()
        arango_agent.create_arangosearch_view(view.english_name, view.compressed, view_fields)
        #--------------------#

        return super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

    def edit(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')
            
        if not data["english_name"] or not data["arabic_name"]:
            return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
            
        oldEntity = self.model.objects.filter(english_name = data['english_name'], database__id=db.id).first()
        if not oldEntity:
            return super().parse_response(('1', 'لا يوجد علاقة بنفس الاسم'),'json')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name']), database__id=db.id).first()
        if tempentity:
            return super().parse_response(('1', 'يوجد علاقة بنفس الاسم العربي'),'json')
        
        edge_view = models.View.objects.filter(english_name=('bank_view_' + oldEntity.english_name)).first()
        arango_agent = ArangoAgent(db.english_name)

        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return super().parse_response(('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة'),'json')
            
            for f in jsonarray:
                fieldFound = False
                for df in oldEntity.data_fields.all():
                    if df.english_name == f["english_name"]:
                        df.arabic_name = f["arabic_name"]
                        df.data_type = f["data_type"]
                        df.indexed = f["indexed"]
                        #change arango field index#
                        if df.indexed:
                            arango_agent.create_persistent_index_for_edge_field(oldEntity.english_name, df.english_name)
                        else:
                            arango_agent.delete_persistent_index_for_edge_field(oldEntity.english_name, df.english_name)
                        #--------------------#
                        df.save(force_update=True)
                        fieldFound = True
                        break
                
                if not fieldFound:
                    tempdf = models.DataField()
                    tempdf.english_name = f["english_name"]
                    tempdf.arabic_name = f["arabic_name"]
                    tempdf.data_type = f["data_type"]
                    tempdf.indexed = f["indexed"]
                    oldEntity.data_fields.add(tempdf, bulk=False)
                    #add new arango field#
                    if tempdf.indexed:
                        arango_agent.create_persistent_index_for_edge_field(oldEntity.english_name, tempdf.english_name)
                    if tempdf.data_type == 'String' and edge_view:
                        arango_agent.add_arangosearch_view_field(edge_view.english_name, tempdf)
                        edge_view.data_fields.add(tempdf)
                    #--------------------#

            for df in oldEntity.data_fields.all():
                fieldFound = False
                for f in jsonarray:
                    if df.english_name == f["english_name"]:
                        fieldFound = True
                        break
                
                if not fieldFound:
                    #delete arango field#
                    arango_agent.delete_persistent_index_for_edge_field(oldEntity.english_name, df.english_name)     
                    for view in models.View.objects.all().iterator():
                        if view.data_fields:
                            for v_df in view.data_fields.all().iterator():
                                if v_df.id == df.id:
                                    arango_agent.delete_arangosearch_view_field(view.english_name, df)
                                    break
                    #--------------------#
                    oldEntity.data_fields.remove(df)
        
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.save(force_update=True)

        return super().parse_response(('0','تمّت العمليّة بنجاح'),'json')

    def delete(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return super().parse_response(('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة'),'json')
            
        oldEntity = self.model.objects.filter(english_name = data['entityid'], database__id=db.id).first()
        if not oldEntity:
            return super().parse_response(('1', 'لا يوجد علاقة بنفس الاسم'),'json')

        arango_agent = ArangoAgent(db.english_name)
        arango_agent.delete_grph(oldEntity.english_name)

        for view in models.View.objects.all().iterator():
            if view.data_fields:
                for v_df in view.data_fields.all().iterator():
                    if type(v_df.owner)==models.Relation and v_df.owner.id == oldEntity.id:
                        arango_agent.delete_arangosearch_view_edge(view.english_name, oldEntity.english_name)
                        break
        oldEntity.delete()

        return super().parse_response(('0','تمّت العمليّة بنجاح'),'json')
