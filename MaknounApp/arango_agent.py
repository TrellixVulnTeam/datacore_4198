import datetime
import random
import time
from arango import ArangoClient
from functools import reduce
from numpy import number

from MaknounApp import models

class ArangoAgent():
    connection_info = {
		'host': 'http://127.0.0.1:8529/',
		'system_database':'_system',
		'username':'root',
		'password':'123456789'
	}

    db = None

    def __init__(self, database=None):
        client = ArangoClient(self.connection_info['host'])
        if not database:
            self.db = client.db(self.connection_info['system_database'], self.connection_info['username'], self.connection_info['password'])
        else:
            self.db = client.db('db_Maknoun_' + database, self.connection_info['username'], self.connection_info['password'])

    def create_database(self, dbname):
        dbname = 'db_Maknoun_' + dbname.strip()
        if not self.db.has_database(dbname):
            self.db.create_database(dbname)

    def delete_database(self, dbname):
        dbname = 'db_Maknoun_' + dbname.strip()
        if self.db.has_database(dbname):
            self.db.delete_database(dbname)
    
    def create_collection(self, name, rep_factor):
        name = 'col_' + name.strip()
        if not self.db.has_collection(name):
            self.db.create_collection(name,replication_factor=rep_factor)

    def delete_collection(self, name):
        name = 'col_' + name.strip()
        if self.db.has_collection(name):
            self.db.delete_collection(name)

    def create_grph(self, name, from_col_name, to_col_name):
        graph_name = 'graph_' + name.strip()
        name = 'edge_' + name.strip()
        from_col_name = 'col_' + from_col_name.strip()
        to_col_name = 'col_' + to_col_name.strip()
        if not self.db.has_graph(graph_name):
            graph = self.db.create_graph(graph_name,replication_factor=2)
            graph.create_edge_definition(name, from_vertex_collections=[from_col_name], to_vertex_collections=[to_col_name])

    def delete_grph(self, name):
        edge_name = 'edge_' + name.strip()
        name = 'graph_' + name.strip()
        if self.db.has_graph(name.strip()):
            graph = self.db.graph(name)
            graph.delete_edge_definition(edge_name, purge=True)
            self.db.delete_graph(name)

    def create_persistent_index_for_collection_field(self, collection_name, field_name):
        collection = self.db.collection('col_' + collection_name)
        field_name = 'f_col_' + collection_name + '_' + field_name.strip()
        found = False
        index_name = 'index_' + field_name
        field_name_array = field_name + '[*]'
        found_array = False
        index_name_array = index_name  + '_array'
        for index in collection.indexes():
            if index['type'] == 'persistent':
                for field in index['fields']:
                    if field == field_name:
                        found = True
                    elif field == field_name_array:
                        found_array = True
        if not found:
            collection.add_persistent_index(name=index_name, fields=[field_name], in_background = False)
        if not found_array:
            collection.add_persistent_index(name=index_name_array, fields=[field_name_array], in_background = False)


    def delete_persistent_index_for_collection_field(self, collection_name, field_name):
        collection = self.db.collection('col_' + collection_name)
        field_name = 'f_col_' + collection_name + '_' + field_name.strip()
        index_name = 'index_' + field_name
        index_name_array = index_name  + '_array'
        for index in collection.indexes():
            if index['name'] == index_name or index['name'] == index_name_array:
                collection.delete_index(index['id'])

    def create_persistent_index_for_edge_field(self, edge_name, field_name):
        edge = self.db.collection('edge_' + edge_name)
        field_name = 'f_col_' + edge_name + '_' + field_name.strip()
        found = False
        index_name = 'index_' + field_name
        field_name_array = field_name + '[*]'
        found_array = False
        index_name_array = index_name  + '_array'
        for index in edge.indexes():
            if index['type'] == 'persistent':
                for field in index['fields']:
                    if field == field_name:
                        found = True
                    elif field == field_name_array:
                        found_array = True
        if not found:
            edge.add_persistent_index(name=index_name, fields=[field_name], in_background = False)
        if not found_array:
            edge.add_persistent_index(name=index_name_array, fields=[field_name_array], in_background = False)

    def delete_persistent_index_for_edge_field(self, edge_name, field_name):
        edge = self.db.collection('edge_' + edge_name)
        field_name = 'f_col_' + edge_name + '_' + field_name.strip()
        index_name = 'index_' + field_name
        index_name_array = index_name  + '_array'
        for index in edge.indexes() or index['name'] == index_name_array:
            if index['name'] == index_name:
                edge.delete_index(index['id'])

    def create_arangosearch_view(self, name, use_compression, fields, create_if_not_exist = True):
        self.create_arabic_text_analyzer()
        self.create_arabic_collation_analyzer()
        links = self.generate_view_links(fields)
        name = 'asview_' + name.strip()
        found = False
        for v in self.db.views():
            if v['name'] == name:
                found = True
                break

        if not found and create_if_not_exist:
            compression = 'lz4'
            if not use_compression:
                compression = 'none'

            self.db.create_arangosearch_view(name, properties={'primarySortCompression': compression, 'links': links})
            return True
        elif found:
            self.db.update_arangosearch_view(name, properties={'links': links})
            return True
        return False

    def delete_arangosearch_view(self, name):
        name = 'asview_' + name.strip()
        self.db.delete_view(name, ignore_missing=True)
    
    def generate_view_links(self, fields):
        links = {}
        if fields:
            collections_and_fields = {}
            for f in fields:
                collection_name = None
                if type(f.owner) == models.Bank:
                    collection_name = 'col_' + f.owner.english_name.strip()
                else:
                    collection_name = 'edge_' + f.owner.english_name.strip()
                
                field_name = 'f_' + collection_name + '_' + f.english_name.strip()
                if not collections_and_fields.get(collection_name):
                    collections_and_fields[collection_name] = []
                collections_and_fields[collection_name].append(field_name)
            
            for key, value in collections_and_fields.items():
                links[key] = {}
                links[key]['analyzers'] = []
                links[key]['fields'] = {}
                for f in value:
                    links[key]['fields'][f] = {'analyzers': [self.db.db_name + '::arabic_text_analyzer',self.db.db_name + '::arabic_collation_analyzer', 'text_en','identity']}
                links[key]['includeAllFields'] = False
                links[key]['storeValues'] = 'none'
                links[key]['trackListPositions'] = False
        return links

    def delete_arangosearch_view_collection(self, name, collection_name):
        name = 'asview_' + name.strip()
        view = self.db.view(name)
        collection_name ='col_' + collection_name.strip()
        links = view.get('links')
        if links and links.get(collection_name):
            del links[collection_name]
            self.db.update_arangosearch_view(name, properties={'links': links})

    def delete_arangosearch_view_edge(self, name, edge_name):
        name = 'asview_' + name.strip()
        view = self.db.view(name)
        edge_name ='edge_' + edge_name.strip()
        links = view.get('links')
        if links and links.get(edge_name):
            del links[edge_name]
            self.db.update_arangosearch_view(name, properties={'links': links})

    def add_arangosearch_view_field(self, name, field):
        name = 'asview_' + name.strip()
        view = self.db.view(name)
        collection_name = None
        if type(field.owner) == models.Bank:
            collection_name = 'col_' + field.owner.english_name.strip()
        else:
            collection_name = 'edge_' + field.owner.english_name.strip()

        field_name = 'f_' + collection_name + '_' + field.english_name.strip()
        links = view.get('links')
        if links:
            col_def = links.get(collection_name)
            if col_def:
                col_def_fields = col_def.get('fields')
                col_def_fields[field_name]= {'analyzers': [self.db.db_name + '::arabic_text_analyzer',self.db.db_name + '::arabic_collation_analyzer', 'text_en','identity']}
            else:
                links[collection_name] = {}
                links[collection_name]['analyzers'] = []
                links[collection_name]['fields'] = {}
                links[collection_name]['fields'][field_name] = {'analyzers': [self.db.db_name + '::arabic_text_analyzer',self.db.db_name + '::arabic_collation_analyzer', 'text_en','identity']}
                links[collection_name]['includeAllFields'] = False
                links[collection_name]['storeValues'] = 'none'
                links[collection_name]['trackListPositions'] = False

        self.db.update_arangosearch_view(name, properties={'links': links})

    def delete_arangosearch_view_field(self, name, field):
        name = 'asview_' + name.strip()
        view = self.db.view(name)
        collection_name = None
        if type(field.owner) == models.Bank:
            collection_name = 'col_' + field.owner.english_name.strip()
        else:
            collection_name = 'edge_' + field.owner.english_name.strip()
        
        field_name = 'f_' + collection_name + '_' + field.english_name.strip()
        links = view.get('links')
        if links:
            col_def = links.get(collection_name)
            if col_def:
                col_def_fields = col_def.get('fields')
                if col_def_fields and col_def_fields.get(field_name):
                    del col_def_fields[field_name]
                    self.db.update_arangosearch_view(name, properties={'links': links})
    
    def create_arabic_text_analyzer(self):
        found = False
        for an in self.db.analyzers():
            if an['name'] == self.db.db_name + '::arabic_text_analyzer':
                found = True
                break
        if not found:
            self.db.create_analyzer(
                name='arabic_text_analyzer',
                analyzer_type='text',
                properties={'locale': "ar.utf-8", 'case': "lower", 'accent': False, 'stemming': True,'stopwords': []},
                features=['frequency','norm','position']
            )
    
    def create_arabic_collation_analyzer(self):
        found = False
        for an in self.db.analyzers():
            if an['name'] == self.db.db_name + '::arabic_collation_analyzer':
                found = True
                break
        if not found:
            self.db.create_analyzer(
                name='arabic_collation_analyzer',
                analyzer_type='collation',
                properties={'locale': "ar.utf-8"},
                features=['frequency','norm','position']
            )

    def has_arabic_chars(self, value):
        archars = ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','د','ش','س','ي','ب','ل','ا','ت','ن','م','ك','ط','ئ','ء','ؤ','ر','ى','ة','و','ز','ظ','أ','ذ']
        for c in archars:
            if c in value:
                return True
        return False

    def get_value_specific_analyzer(self, value):
        analyzer = 'text_en'
        if self.has_arabic_chars(value):
            analyzer = 'arabic_text_analyzer'
        return analyzer

    def format_date_iso(self, dt):
        return datetime.datetime.strptime(dt.replace('ص','AM').replace('م','PM').replace('\u200f',''), '%d/%m/%Y %I:%M %p').isoformat()

    def transform_result_gridjs(self, result):
        sources = {}
        data_fields = {}
        for b in models.Bank.objects.all().iterator():
            sources[b.english_name] = {'name':b.arabic_name,'icon':b.icon_class}
        for r in models.Relation.objects.all().iterator():
            sources[r.english_name] = {'name':r.arabic_name,'icon':'bi-diagram-3-fill'}
        for f in models.DataField.objects.all().iterator():
            data_fields[f'f_{"col" if type(f.owner) is models.Bank else "edge"}_{f.owner.english_name}_{f.english_name}'] = f.arabic_name

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
                if col == '_id':
                    src['columns'][index] ='المعرّف'
                elif col in data_fields.keys():
                    src['columns'][index] = data_fields[col]

        del result['data']
        return result
    
    def get_object_by_id(self, id):
        colname = id.split('/')[0]
        _id = id.split('/')[1]
        col = self.db.collection(colname)
        return col.get(_id)
    
    def transform_result_devexpress(self, result):
        data_types_map = {'String':'string','Number':'number','Date':'datetime','Bool':'boolean'}
        sources = {}
        data_fields = {}
        db_data_fields = {}
        for b in models.Bank.objects.all().iterator():
            sources[b.english_name] = {'name':b.arabic_name,'icon':b.icon_class}
        for r in models.Relation.objects.all().iterator():
            sources[r.english_name] = {'name':r.arabic_name,'icon':'bi-diagram-3-fill'}
        for f in models.DataField.objects.all().iterator():
            data_fields[f'f_{"col" if type(f.owner) is models.Bank else "edge"}_{f.owner.english_name}_{f.english_name}'] = f.id
            db_data_fields[f.id] = f

        data_fields['_id'] = 'المعرّف'
        data_fields['_active'] = 'مفعّل'
        data_fields['_creation'] = 'تاريخ_الإنشاء'
        data_fields['_from'] = 'من'
        data_fields['_to'] = 'إلى'

        result['srouces'] = {}
        for row in result['data']:
            del row['_key']
            del row['_rev']
            for fname in row.keys():
                src_name = row['_id'].split('/')[0]
                source_type = None
                if src_name.startswith('edge'):
                    src_name = src_name[5:]
                    source_type = 'edge'
                else:
                    src_name = src_name[4:]
                    source_type = 'collection'
                if src_name not in result['srouces']:
                    result['srouces'][src_name] = {'icon':sources[src_name]['icon'], 'type': source_type, 'ar_name': sources[src_name]['name'], 'columns': [], 'data': []}
                    result['srouces'][src_name]['columns'].append({'dataField':None})
                if '[*]' not in fname and fname not in result['srouces'][src_name]['columns']:          
                    dfv = data_fields.get(fname,fname)
                    if dfv and type(dfv) is not int:
                        if fname not in [d['dataField'] for d in result['srouces'][src_name]['columns']]:
                            result['srouces'][src_name]['columns'].append({'dataField':fname,'caption':dfv})
                    else:
                        df = db_data_fields[dfv]
                        ename = f'f_{"col" if type(df.owner) is models.Bank else "edge"}_{df.owner.english_name}_{df.english_name}'
                        if df and ename not in [d['dataField'] for d in result['srouces'][src_name]['columns']]:
                            result['srouces'][src_name]['columns'].append({'dataField':ename,'caption':df.arabic_name,'datatype': reduce(lambda x, y: x.replace(*y), [df.data_type, *list(data_types_map.items())])})
        
        for k,v in data_fields.items():
            if v in db_data_fields:
                 data_fields[k] = db_data_fields[v].arabic_name

        for row in result['data']:
            formated_row = {}
            src_name = row['_id'].split('/')[0]
            if src_name.startswith('edge'):
                src_name = src_name[5:]
            else:
                src_name = src_name[4:]
            
            for (k,v) in row.items():
                if type(v) is list:
                    formated_row[k]=', '.join(map(str, v))
                else:
                    formated_row[k]=v
            
            result['srouces'][src_name]['data'].append(formated_row)
        
        del result['data']
        return result

    def full_text_search(self, fields, query):
        query_tokens = query.split(' ')
        analyzer = self.get_value_specific_analyzer(query)
        fields_dic = {}
        for f in fields:
            parts = f.split('.') 
            view_name =  'asview_' + parts[0]
            source_name = parts[1]
            if not view_name in fields_dic:
                fields_dic[view_name] = []
            fields_dic[view_name].append('f_' + source_name + '_' + parts[2])
        
        query_string = ''
        docs_string = ','
        results=[]
        for vindex,view in enumerate(fields_dic.keys(), start=0):
            results.append(f'QR{vindex+1}')
            query_string+= f'\n\nLET QR{vindex+1} = (\n\tFOR doc_{view} IN {view}\n\tSEARCH\n'
            like_query= '\tANALYZER(\n'
            Levenshtein_query= '\tANALYZER(\n'
            for findex,field in enumerate(fields_dic[view], start=0):
                if findex > 0:
                    like_query+= ' OR\n'
                    Levenshtein_query+= ' OR\n'
                for index, qtoken in enumerate(query_tokens, start=0):
                    if index > 0:
                        like_query+= ' OR\n'
                        Levenshtein_query+= ' OR\n'
                    like_query+= f'\t\tLike(doc_{view}.{field}, "%{qtoken}%")'
                    Levenshtein_query+= f'\t\tLEVENSHTEIN_MATCH(doc_{view}.{field}, "{qtoken}",1,true)'
            like_query+=',"identity")'
            Levenshtein_query+=f',"{analyzer}")'
            query_string+= like_query + ' OR\n' + Levenshtein_query + ' OR\n\t'
            query_string+= f'ANALYZER(\n\t\tPHRASE(doc_{view}.{field}, "{query.strip()}"), "{analyzer}")'
            query_string+= f'\n\tLIMIT 10000'
            query_string+= f'\n\tSORT BM25(doc_{view}) DESC'
            query_string+= f'\n\tRETURN doc_{view})'

        cursor = None
        data = None
        if len(results) > 1:
            query_string += f'\n\nRETURN UNION_DISTINCT({docs_string.join(results)})'
        else:
            query_string += f'\n\nRETURN {results[0]}' 

        print('Executing Query:\n' + query_string)
        cursor = self.db.aql.execute(query_string)
        data = [doc for doc in cursor]
        result = []
        if len(data) > 0:
            result = data[0]
        return {'time':cursor._stats['execution_time'],'count':len(result),'data':result}

    def advanced_qb_search(self, source, rules):
        asquery = []
        query= []
        final_query = f'FOR doc IN {source} FILTER'
        self.build_qb_query(rules['condition'], 0, rules['rules'], asquery, query)
        final_query = '\n'.join(asquery).strip() +  '\n\n' + final_query + '\n' + '\n'.join(query).strip() + '\nLIMIT 10000\nRETURN doc'
        print('Executing Query:\n' + final_query)
        cursor = self.db.aql.execute(final_query)
        data = [doc for doc in cursor]
        return {'time':cursor._stats['execution_time'],'count':len(data),'data':data}

    def build_qb_query(self, current_condition, indent, rules, asquery, query):
        tab = '\t'
        rule_index = -1
        for rule in rules:
            if 'condition' in rule:
                query.append(f'{(tab*indent)}{current_condition} (')
                self.build_qb_query(rule['condition'], indent+1, rule['rules'], asquery, query)
                query.append(f'{(tab*indent)})')
            else:
                rule_index+=1
                temp_q = ''
                rvalue = rule['value']
                rvalue2 = None
                if type(rule['value']) is list:
                    rvalue = rule['value'][0]
                    rvalue2 = rule['value'][1]
                
                analyzer = 'text_en'
                rvalue_formatted = rvalue
                rvalue2_formatted = rvalue2
                rvalue_array = ''
                if rule['value'] and rule['type'] == 'string':
                    rvalue = rvalue.strip()
                    rvalue_array = rule['value'].split(',')
                    rvalue_formatted = f'"{rvalue}"'
                    if self.has_arabic_chars(rvalue):
                        analyzer = 'arabic_text_analyzer'
                elif rule['value'] and rule['type'] == 'datetime':
                    rvalue_formatted = f'DATE_TIMESTAMP(DATE_ISO8601("{self.format_date_iso(rvalue)}"))'
                    if rvalue2:
                        rvalue2_formatted = f'DATE_TIMESTAMP(DATE_ISO8601("{self.format_date_iso(rvalue2)}"))'

                if '@' in rule['id']:
                    field_name = rule['id'].split('@')[0]
                    view_name = rule['id'].split('@')[1]
                    q_name = 'asquery_' + str(round(time.time()) - random.randint(0, 10000000))
                    temp_q += f'LET {q_name} = (FOR doc IN {view_name} SEARCH '
                    append_to_main = False

                    if rule['operator'] == 'equal':
                        temp_q += f'doc.{field_name} == {rvalue_formatted}'
                    elif rule['operator'] == 'not_equal':
                            temp_q += f'doc.{field_name} != {rvalue_formatted}'
                    elif rule['operator'] == 'in':
                        temp_q += f'doc.{field_name} IN {rvalue_array}'
                    elif rule['operator'] == 'not_in':
                        temp_q += f'doc.{field_name} NOT IN {rvalue_array}'
                    elif rule['operator'] == 'begins_with':
                        temp_q += f'STARTS_WITH(doc.{field_name}, {rvalue_formatted})'
                    elif rule['operator'] == 'not_begins_with':
                        temp_q += f'NOT STARTS_WITH(doc.{field_name}, {rvalue_formatted})'
                    elif rule['operator'] == 'contains':
                        temp_q += f'LIKE(doc.{field_name}, "%{rvalue}%")'
                    elif rule['operator'] == 'not_contains':
                        temp_q += f'NOT LIKE(doc.{field_name}, "%{rvalue}%")'
                    elif rule['operator'] == 'between':
                        temp_q += f'IN_RANGE(doc.{field_name}, {rvalue_formatted}, {rvalue2_formatted}, true, true)'
                    elif rule['operator'] == 'not_between':
                        temp_q += f'NOT IN_RANGE(doc.{field_name}, {rvalue_formatted}, {rvalue2_formatted}, true, true)'
                    elif rule['operator'] == 'ends_with':
                        temp_q += f'LIKE(doc.{field_name}, "%{rvalue}")'
                    elif rule['operator'] == 'not_ends_with':
                        temp_q += f'NOT LIKE(doc.{field_name}, "%{rvalue}")'
                    elif rule['operator'] == 'similar':
                        temp_q += f'ANALYZER(LEVENSHTEIN_MATCH(doc.{field_name}, {rvalue_formatted},1,true),"{analyzer}")'
                    elif rule['operator'] == 'not_similar':
                        temp_q += f'NOT ANALYZER(LEVENSHTEIN_MATCH(doc.{field_name}, {rvalue_formatted},1,true),"{analyzer}")'
                    elif rule['operator'] == 'is_empty':
                        temp_q += f'doc.{field_name} == ""'
                    elif rule['operator'] == 'is_not_empty':
                        temp_q += f'doc.{field_name} != ""'
                    elif rule['operator'] == 'is_null':
                        temp_q += f'doc.{field_name} != null'
                    elif rule['operator'] == 'is_not_null':
                        temp_q += f'doc.{field_name} == null'
                    elif rule['operator'] == 'less':
                        temp_q += f'doc.{field_name} < {rvalue_formatted}'
                    elif rule['operator'] == 'less_or_equal':
                        temp_q += f'doc.{field_name} <= {rvalue_formatted}'
                    elif rule['operator'] == 'greater':
                        temp_q += f'doc.{field_name} > {rvalue_formatted}'
                    elif rule['operator'] == 'greater_or_equal':
                        temp_q += f'doc.{field_name} >= {rvalue_formatted}'
                    elif rule['operator'] == 'is_defined':
                        temp_q = f'HAS(doc, "{field_name}")'
                        append_to_main = True
                    elif rule['operator'] == 'is_not_defined':
                        temp_q = f'NOT HAS(doc, "{field_name}")'
                        append_to_main = True
                    
                    condition = f'{current_condition} ' if rule_index>0 else ''
                    if not append_to_main:
                        temp_q += ' RETURN doc._id)'
                        asquery.append(temp_q)
                        query.append(f'{(tab*indent)}{condition}doc._id in {q_name}')
                    else:
                        query.append(f'{(tab*indent)}{condition}{temp_q}')    
                else:
                    field_name = rule['id']

                    if rule['operator'] == 'equal':
                        temp_q += f'doc.{field_name} == {rvalue_formatted} OR {rvalue_formatted} IN doc.{field_name}[*]'
                    elif rule['operator'] == 'not_equal':
                            temp_q += f'doc.{field_name} != {rvalue_formatted} OR {rvalue_formatted} NOT IN doc.{field_name}[*]'
                    elif rule['operator'] == 'in':
                        temp_q += f'doc.{field_name} IN {rvalue_array} OR doc.{field_name} ANY IN {rvalue_array}'
                    elif rule['operator'] == 'not_in':
                        temp_q += f'doc.{field_name} NOT IN {rvalue_array} OR doc.{field_name} ALL NOT IN {rvalue_array}'
                    elif rule['operator'] == 'between':
                        temp_q += f'(doc.{field_name} >= {rvalue_formatted} AND doc.{field_name} <= {rvalue2_formatted}) OR (COUNT(INTERSECTION((for value in doc.{field_name}[*] filter value >= {rvalue_formatted} return value),(for value in doc.{field_name}[*] filter value <= {rvalue2_formatted} return value))) > 0)'
                    elif rule['operator'] == 'not_between':
                        temp_q += f'doc.{field_name} < {rvalue_formatted} OR doc.{field_name} > {rvalue2_formatted} OR doc.{field_name} ANY < {rvalue_formatted} OR doc.{field_name} ANY > {rvalue2_formatted}'
                    elif rule['operator'] == 'is_empty':
                        temp_q += f'doc.{field_name} == "" OR "" IN doc.{field_name}[*]'
                    elif rule['operator'] == 'is_not_empty':
                        temp_q += f'doc.{field_name} != "" OR "" NOT IN doc.{field_name}[*]'
                    elif rule['operator'] == 'is_null':
                        temp_q += f'doc.{field_name} != null OR null NOT IN doc.{field_name}[*]'
                    elif rule['operator'] == 'is_not_null':
                        temp_q += f'doc.{field_name} == null OR null IN doc.{field_name}[*]'
                    elif rule['operator'] == 'less':
                        temp_q += f'doc.{field_name} < {rvalue_formatted} OR doc.{field_name} ANY < {rvalue_formatted}'
                    elif rule['operator'] == 'less_or_equal':
                        temp_q += f'doc.{field_name} <= {rvalue_formatted} OR doc.{field_name} ANY < {rvalue_formatted}'
                    elif rule['operator'] == 'greater':
                        temp_q += f'doc.{field_name} > {rvalue_formatted} OR doc.{field_name} ANY > {rvalue_formatted}'
                    elif rule['operator'] == 'greater_or_equal':
                        temp_q += f'doc.{field_name} >= {rvalue_formatted} OR doc.{field_name} ANY >= {rvalue_formatted}'
                    elif rule['operator'] == 'is_defined':
                        temp_q += f'HAS(doc, "{field_name}")'
                    elif rule['operator'] == 'is_not_defined':
                        temp_q += f'NOT HAS(doc, "{field_name}")'

                    condition = f'{current_condition} ' if rule_index>0 else ''
                    query.append(f'{(tab*indent)}{condition}{temp_q}')                          
            
