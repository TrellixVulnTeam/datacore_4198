from arango import ArangoClient

from datacoreapp import models

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
            self.db = client.db('db_' +database, self.connection_info['username'], self.connection_info['password'])

    def create_database(self, dbname):
        dbname = 'db_' + dbname.strip()
        if not self.db.has_database(dbname):
            self.db.create_database(dbname)

    def delete_database(self, dbname):
        dbname = 'db_' + dbname.strip()
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
        field_name = 'f_' + field_name.strip()
        found = False
        index_name = 'index_' + field_name
        for index in collection.indexes():
            if found:
                break
            if index['type'] == 'persistent':
                for field in index['fields']:
                    if field == field_name:
                        found = True
                        break
        if not found:
            collection.add_persistent_index(name=index_name, fields=[field_name], in_background = False)

    def delete_persistent_index_for_collection_field(self, collection_name, field_name):
        collection = self.db.collection('col_' + collection_name)
        field_name = 'f_' + field_name.strip()
        index_name = 'index_' + field_name
        for index in collection.indexes():
            if index['name'] == index_name:
                collection.delete_index(index['id'])

    def create_persistent_index_for_edge_field(self, edge_name, field_name):
        edge = self.db.collection('edge_' + edge_name)
        field_name = 'f_' + field_name.strip()
        found = False
        index_name = 'index_' + field_name
        for index in edge.indexes():
            if found:
                break
            if index['type'] == 'persistent':
                for field in index['fields']:
                    if field == field_name:
                        found = True
                        break
        if not found:
            edge.add_persistent_index(name=index_name, fields=[field_name], in_background = False)

    def delete_persistent_index_for_edge_field(self, edge_name, field_name):
        edge = self.db.collection('edge_' + edge_name)
        field_name = 'f_' + field_name.strip()
        index_name = 'index_' + field_name
        for index in edge.indexes():
            if index['name'] == index_name:
                edge.delete_index(index['id'])

    def create_arangosearch_view(self, name, use_compression, fields):
        self.create_arabic_text_analyzer()
        self.create_arabic_collation_analyzer()
        links = self.generate_view_links(fields)
        name = 'asview_' + name.strip()
        found = False
        for v in self.db.views():
            if v['name'] == name:
                found = True
                break

        if not found:
            compression = 'lz4'
            if not use_compression:
                compression = 'none'

            self.db.create_arangosearch_view(name, properties={'primarySortCompression': compression, 'links': links})
        else:
            self.db.update_arangosearch_view(name, properties={'links': links})

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
                
                field_name = 'f_' + f.english_name.strip()
                if not collections_and_fields.get(collection_name):
                    collections_and_fields[collection_name] = []
                collections_and_fields[collection_name].append(field_name)
            
            for key, value in collections_and_fields.items():
                links[key] = {}
                links[key]['analyzers'] = []
                links[key]['fields'] = {}
                for f in value:
                    links[key]['fields'][f] = {'analyzers': [self.db.db_name + '::arabic_text_analyzer',self.db.db_name + '::arabic_collation_analyzer']}
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
        field_name = 'f_' + field.english_name.strip()
        if type(field.owner) == models.Bank:
            collection_name = 'col_' + field.owner.english_name.strip()
        else:
            collection_name = 'edge_' + field.owner.english_name.strip()
        links = view.get('links')
        if links:
            col_def = links.get(collection_name)
            if col_def:
                col_def_fields = col_def.get('fields')
                if col_def_fields:
                    col_def_fields[field_name]= {'analyzers': [self.db.db_name + '::arabic_text_analyzer',self.db.db_name + '::arabic_collation_analyzer']}
                    self.db.update_arangosearch_view(name, properties={'links': links})

    def delete_arangosearch_view_field(self, name, field):
        name = 'asview_' + name.strip()
        view = self.db.view(name)
        collection_name = None
        field_name = 'f_' + field.english_name.strip()
        if type(field.owner) == models.Bank:
            collection_name = 'col_' + field.owner.english_name.strip()
        else:
            collection_name = 'edge_' + field.owner.english_name.strip()
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
