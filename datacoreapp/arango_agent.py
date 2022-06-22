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
        if not self.db.has_database(dbname):
            self.db.create_database(dbname)

    def delete_database(self, dbname):
        if self.db.has_database(dbname):
            self.db.delete_database(dbname)
    
    def create_collection(self, name):
        if not self.db.has_collection(name):
            self.db.create_collection(name)
        # if fields:
        #     col = self.db.collection(name)
        #     for f in fields:
        #         col.add_persistent_index(name='pi_')
        

    def delete_collection(self, name):
        if self.db.has_collection(name):
            self.db.delete_collection(name)
