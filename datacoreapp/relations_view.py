from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
from django.views import View 
from datacoreapp import models
from datacoreapp import views
from django.db.models import Q
from datacoreapp import master_entity_view
import json

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
            return('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة')

        if not data["english_name"] or not data["arabic_name"]:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
        
        oldEntity = self.model.objects.filter(Q(english_name = data['english_name']) | Q(arabic_name = data['arabic_name']), database__id=db.id).first()

        if oldEntity:
            return('1', 'يوجد علاقة بنفس الاسم، الرجاء اختيار اسم آخر')

        if not data['from_bank'] or not data['to_bank']:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')

        oldEntity = self.model.objects.filter(from_bank = data['from_bank'], to_bank = data['to_bank']).first()

        if oldEntity:
            return('1', 'يوجد علاقة بين هذين البنكين، الرجاء تغيير اتجاه العلاقة')
        
        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])

            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
                countf = 0
                for f2 in jsonarray:
                    if f["english_name"] == f2["english_name"] or f["arabic_name"] == f2["arabic_name"]:
                        countf+=1
                if countf > 1:
                    return('1', 'لا يمكن وجود حقلين بنفس الاسم')

        from_bank  = models.Bank.objects.filter(id = data['from_bank']).first()
        to_bank  = models.Bank.objects.filter(id = data['to_bank']).first()

        relation = models.Relation()
        relation.english_name = data['english_name']
        relation.arabic_name = data['arabic_name']
        relation.from_bank = from_bank
        relation.to_bank = to_bank
        relation.database = db  
        #add arango edge here#

        #--------------------#
        relation.save()

        if data['data_fields']:
            content_type = ContentType.objects.get(app_label='datacoreapp', model='relation')
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                tempdf = models.DataField(content_type=content_type, object_id=relation.id)
                tempdf.english_name = f["english_name"]
                tempdf.arabic_name = f["arabic_name"]
                tempdf.data_type = f["data_type"]
                tempdf.indexed = f["indexed"]
                #add arango edge field here#

                #--------------------#
                tempdf.save()
        
        return ('0','تمّت العمليّة بنجاح')

    def edit(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة')
            
        if not data["english_name"] or not data["arabic_name"]:
            return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
            
        oldEntity = self.model.objects.filter(english_name = data['english_name'], database__id=db.id).first()
        if not oldEntity:
            return('1', 'لا يوجد علاقة بنفس الاسم')

        tempentity = self.model.objects.filter(~Q(english_name = data['english_name']), Q(arabic_name = data['arabic_name']), database__id=db.id).first()
        if tempentity:
            return('1', 'يوجد علاقة بنفس الاسم العربي')
        
        if data['data_fields']:
            jsonarray = json.loads(data['data_fields'])
            for f in jsonarray:
                if not f["english_name"] or not f["arabic_name"] or not len(f["english_name"])>0 or not len(f["arabic_name"])>0:
                    return('1', 'الرجاء التأكد من تعبئة كل الخانات المطلوبة')
            
            for f in jsonarray:
                fieldFound = False
                for df in oldEntity.data_fields.all():
                    if df.english_name == f["english_name"]:
                        df.arabic_name = f["arabic_name"]
                        df.data_type = f["data_type"]
                        df.indexed = f["indexed"]
                        if df.indexed != f["indexed"]:
                            #change arango field index#
                            print()
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
                    
                    #--------------------#

            for df in oldEntity.data_fields.all():
                fieldFound = False
                for f in jsonarray:
                    if df.english_name == f["english_name"]:
                        fieldFound = True
                        break
                
                if not fieldFound:
                    oldEntity.data_fields.remove(df)
                    #delete arango field#
                                    
                    #--------------------#
        
        oldEntity.arabic_name = data['arabic_name']
        oldEntity.save(force_update=True)

        return ('0','تمّت العمليّة بنجاح')

    def delete(self, data, request):
        db = models.Database.objects.filter(english_name=request.user.current_database_name).first()
        if not db:
            return('1', 'يبدو أن أحدهم قام بحذف قاعدة البيانات الحاليّة')
            
        oldEntity = self.model.objects.filter(english_name = data['entityid'], database__id=db.id).first()
        if not oldEntity:
            return('1', 'لا يوجد علاقة بنفس الاسم')
        oldEntity.delete()

        return ('0','تمّت العمليّة بنجاح')
