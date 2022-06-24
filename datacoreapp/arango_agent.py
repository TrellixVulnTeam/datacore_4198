from arango import ArangoClient

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
            self.db = client.db(database, self.connection_info['username'], self.connection_info['password'])

    def create_database(self, dbname):
        dbname = 'db_' + dbname.strip()
        if not self.db.has_database(dbname):
            self.db.create_database(dbname)

    def delete_database(self, dbname):
        dbname = 'db_' + dbname.strip()
        if self.db.has_database():
            self.db.delete_database()
    
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

    def create_arangosearch_view(self, name, use_compression):
        self.create_arabic_text_analyzer()
        self.create_arabic_collation_analyzer()
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

            self.db.create_arangosearch_view(name, properties={'primarySortCompression': compression})

    def generate_view_links(fields):
        links = '"links" : \{'
        if fields:
            collections_and_fields = {}
            for f in fields:
                collection_name = 'col_' + f.split('.')[0].strip()
                field_name = 'f_' + f.split('.')[1].strip()
                if not collections_and_fields[collection_name]:
                    collections_and_fields[collection_name] = []

                collections_and_fields[collection_name].append(field_name)
            
            for key, value in collections_and_fields.items():
                links += '\t"'+ key + '" : \{\n\t"analyzers" : [],\n\t"fields" : \{'
                for f in value:
                    links+= '\n\t\t"' + f + '" : {\n\t\t"analyzers" : [\n\t\t\t"' + self.db.db_name + '::arabic_text_analyzer' + '","' + self.db.db_name + '::arabic_collation_analyzer' + '"\n\t\t]\n\t\t\},'
                
                links = links[:-1] + '\n\t\},\n\t"includeAllFields" : false,\n\t"storeValues" : "none",\n\t"trackListPositions" : false\n\t}\n}'

    def delete_arangosearch_view(self, name):
        name = 'asview_' + name.strip()
        self.db.delete_view(name, ignore_missing=True)

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
