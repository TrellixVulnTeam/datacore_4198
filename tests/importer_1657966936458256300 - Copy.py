import logging
import traceback
import pandas as pd
import json
import time
import sys, os
import argostranslate.package, argostranslate.translate
from arango import ArangoClient

class Importer():
	arango_host = 'http://127.0.0.1:8529/'
	arango_database = 'db_Maknoun_' + 'db1'
	arango_username = 'root'
	arango_password = '123456789'
	config = {
    "file_name": "C:/Users/Gph spc/Downloads/Sample-Spreadsheet-5000-rows.csv",
    "has_header": False,
    "import_all_files": False,
    "used_fields": [
        1,
        8,
        3,
        0,
        2,
        7
    ],
    "collections": [
        {
            "index": 2,
            "name": "col_person",
            "name_ar": "\u0627\u0644\u0627\u0641\u0631\u0627\u062f",
            "fields_indecies": [
                1,
                8,
                3
            ],
            "fields_names": [
                "f_col_person_name",
                "f_col_person_address",
                "f_col_person_passport_number"
            ],
            "fields": [
                {
                    "name": "f_col_person_name",
                    "name_ar": "\u0627\u0644\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 1
                },
                {
                    "name": "f_col_person_address",
                    "name_ar": "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
                    "type": "String",
                    "format": "",
                    "match": False,
                    "ff_index": 8
                },
                {
                    "name": "f_col_person_passport_number",
                    "name_ar": "\u0631\u0642\u0645_\u062c\u0648\u0627\u0632_\u0627\u0644\u0633\u0641\u0631",
                    "type": "Number",
                    "format": "",
                    "match": False,
                    "ff_index": 3
                }
            ],
            "identity_fields": [
                "f_col_person_name"
            ]
        },
        {
            "index": 3,
            "name": "col_hotel",
            "name_ar": "\u0627\u0644\u0641\u0646\u0627\u062f\u0642",
            "fields_indecies": [
                2,
                7
            ],
            "fields_names": [
                "f_col_hotel_name",
                "f_col_hotel_adress"
            ],
            "fields": [
                {
                    "name": "f_col_hotel_name",
                    "name_ar": "\u0627\u0644\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 2
                },
                {
                    "name": "f_col_hotel_adress",
                    "name_ar": "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
                    "type": "String",
                    "format": "",
                    "match": False,
                    "ff_index": 7
                }
            ],
            "identity_fields": [
                "f_col_hotel_name"
            ]
        }
    ],
    "edges": [
        {
            "name": "edge_reservations",
            "name_ar": "\u0627\u0644\u062d\u062c\u0648\u0632\u0627\u062a",
            "from_col": 2,
            "to_col": 3,
            "fields_indecies": [
                0
            ],
            "fields_names": [
                "f_edge_reservations_room"
            ],
            "fields": [
                {
                    "name": "f_edge_reservations_room",
                    "name_ar": "\u0631\u0642\u0645_\u0627\u0644\u063a\u0631\u0641\u0629",
                    "type": "Number",
                    "format": "",
                    "match": False,
                    "ff_index": 0
                }
            ],
            "identity_fields": []
        }
    ]
}
	session_key = str(round(time.time()))
	doc_key = 0
	logs = ''

	def log(self, msg):
		print(msg)
		self.logs+=str(msg) + '\n'

	def generate_key(self):
		self.doc_key += 1
		return f'{self.session_key}.{self.doc_key}'
	
	def to_numeric(self, value):
		if value and isinstance(value, list):
			result = []
			for v in value:
				result.append(pd.to_numeric(str(v), errors='raise'))
			return result
		elif value and len(str(value).strip())>0:
			return pd.to_numeric(str(value), errors='raise')
		return value

	def to_date(self, value, format):
		if value and isinstance(value, list):
			result = []
			for v in value:
				result.append(pd.to_datetime(str(v), format=format, exact=False, errors='raise'))
			return result
		elif value and len(str(value).strip())>0:
			return pd.to_datetime(str(value), format=format, exact=False, errors='raise')
		return value

	def to_string(self, value):
		if value and isinstance(value, list):
			result = []
			for v in value:
				result.append(str(v))
			return result
		elif type(value) is bytes:
			return str(value,encoding="utf-8")
		elif value and len(str(value).strip())>0:
			return str(value)
		return value
		
	def to_array(self, value, splitter):
		if value and isinstance(value, list):
			result = []
			for v in value:
				result.append(str(v).split(splitter))
			return result
		elif value and len(str(value).strip())>0:
			return str(value).split(splitter)
		return value

	def map_to_list_or_single(self, v):
		if len(v)>0:
			x = list(set(v))
			if not x:
				return None
			if len(x)==1:
				return x[0]
			return x
		return None

	def map_to_first(self, v):
		if len(v)>0:
			return list(v)[0]
		return None

	def group_by_identity(self, source):
		non_identity_fields = [item for item in source['fields_names'] if item not in source['identity_fields']]
		non_identity_fields_agg = {}
		if non_identity_fields and len(non_identity_fields)>0:
			for f in non_identity_fields:
				non_identity_fields_agg[f] = self.map_to_list_or_single

		non_identity_fields_agg['_key'] = self.map_to_first	
		return source['data'].groupby(source['identity_fields'], as_index = False).agg(non_identity_fields_agg)
	
	def cast_fields(self,source):
		boolean_map = {'1':True,'true':True,'True':True,'TRUE':True,'yes':True,'Yes':True,'YES':True,'ok':True,'Ok':True,'OK':True,'نعم':True,'صح':True,'صحيح':True,'ايجابي':True,'إيجابي':True,
					'0':False,'false':False,'False':False,'FALSE':False,'no':False,'No':False,'NO':False,'not':False,'Not':False,'NOT':False,'كلا':False,'خطأ':False,'خطا':False,'خاطئ':False,'سلبي':False}

		for field in source['fields']:
			if field['type'] == 'String':
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.to_string(x))
			elif field['type'] == 'Number':
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.to_numeric(x))
			elif field['type'] == 'Date':
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.to_date(x,field['format']))
			elif field['type'] == 'Bool':
				source['data'][field['name']] = source['data'][field['name']].map(boolean_map)
			elif field['type'] == 'Array':
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.to_array(x,field['format']))
		
		return source['data']

	def translate_fields(self,source):
		python_path = sys.executable
		from_code = "en"
		to_code = "ar"
		download_path = os.path.join(os.path.dirname(python_path), 'static\\translate-en_ar-1_0.argosmodel')
		argostranslate.package.install_from_path(download_path)

		# Translate
		installed_languages = argostranslate.translate.get_installed_languages()
		from_lang = list(filter(
			lambda x: x.code == from_code,
			installed_languages))[0]
		to_lang = list(filter(
			lambda x: x.code == to_code,
			installed_languages))[0]
		translation = from_lang.get_translation(to_lang)

		for field in source['fields']:
			if field['format'] == 'translate':
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.apply_translation(translation, x))

		return source['data']

	def apply_translation(self, translation, value):
		if value and isinstance(value, list):
			result = []
			for v in value:
				result.append(translation.translate(v))
				return result
		elif value and len(str(value).strip())>0:
			return translation.translate(value)
		return value
	
	def populate_collections(self,df):
		self.log('Manipulating collections...')
		for col in self.config['collections']:
			#select required columns from dataframe
			col['data'] = df.iloc[:,col['fields_indecies']]
			#change columns names
			col['data'] = col['data'].set_axis(col['fields_names'], axis='columns')
			#add _key column
			col['data']['_key'] = col['data'].apply(lambda x: self.generate_key(), axis=1)
			#merge duplicate rows based on identity_fields
			if(len(col['identity_fields'])>0):
				col['data'] = self.group_by_identity(col)
			#add _active column
			col['data'] = col['data'].assign(_active=True)
			#cast collection fields to type and format
			col['data'] = self.cast_fields(col)
			#translate collection fields if needed
			col['data'] = self.translate_fields(col)
			self.log('\n' + col['name'] + ' data:\n---------------------------\n')
			self.log(col['data'])

	def populate_edges(self,df):
		self.log('Manipulating edges...')
		for edge in self.config['edges']:
			#select required columns from dataframe
			edge['data'] = df.iloc[:,edge['fields_indecies']]
			#change columns names
			edge['data'] = edge['data'].set_axis(edge['fields_names'], axis='columns')
			for col in self.config['collections']:
				if col['index'] == edge['from_col']:
					#add collection _key column as _from to edge
					edge['data'] = edge['data'].join(col['data']['_key'])
					edge['data'] = edge['data'].rename({'_key':'_from'}, axis='columns')
					#replacing nan _from and _to fields with the first available key
					edge['data']['_from'] = edge['data']['_from'].fillna(method='ffill')
					#adding collection name as prefix for the _from field
					edge['data']['_from'] = edge['data']['_from'].apply(lambda x: f"{col['name']}/{x}")
				elif col['index'] == edge['to_col']:
					#add collection _key column as _to to edge
					edge['data'] = edge['data'].join(col['data']['_key'])
					edge['data'] = edge['data'].rename({'_key':'_to'}, axis='columns')
					#replacing nan _from and _to fields with the first available key
					edge['data']['_to'] = edge['data']['_to'].fillna(method='ffill')
					#adding collection name as prefix for the _to field
					edge['data']['_to'] = edge['data']['_to'].apply(lambda x: f"{col['name']}/{x}")
			
			#replacing nan _from and _to fields with the first available key
			edge['data']['_from'] = edge['data']['_from'].fillna(method='ffill')
			edge['data']['_to'] = edge['data']['_to'].fillna(method='ffill')
			
			#add _key column
			edge['data']['_key'] = edge['data'].apply(lambda x: self.generate_key(), axis=1)

			#merge duplicate rows based on identity_fields
			if(len(edge['identity_fields'])>0):
				edge['identity_fields'] = edge['identity_fields'].extend(['_from','_to'])
				edge['data'] = self.group_by_identity(edge)
			
			#add _active column
			edge['data'] = edge['data'].assign(_active=True)

			#cast edge fields to type and format
			edge['data'] = self.cast_fields(edge)
			#translate edge fields if needed
			edge['data'] = self.translate_fields(edge)
			
			self.log('\n' + edge['name'] + ' data:\n---------------------------\n')
			self.log(edge['data'])

	def write_collections(self,db):
		self.log('Writing collections to arangodb...')
		for col in self.config['collections']:
			arango_collection = db.collection(col['name'])
			jsondata = json.loads(col['data'].to_json(orient='records'))
			arango_collection.import_bulk(jsondata)

	def write_edges(self,db):
		self.log('Writing edges to arangodb...')
		for edge in self.config['edges']:
			arango_collection = db.collection(edge['name'])
			jsondata = json.loads(edge['data'].to_json(orient='records'))
			arango_collection.import_bulk(jsondata)

	def start_import(self):
		try:
			start_time = time.time()
			files = []
			self.log('Files to import:')
			if self.config['import_all_files']:
				dirname = os.path.dirname(os.path.abspath(self.config['file_name']))
				for f in os.listdir(dirname):
					if os.path.isfile(os.path.join(dirname,f)) and f.endswith('.csv'):
						self.log(f'{f}')
						files.append(os.path.abspath(os.path.join(dirname,f)))
			else:
				files.append(os.path.abspath(self.config['file_name']))

			self.log('-------------------------------\n')

			for file in files:
				f_start_time = time.time()
				self.log(f'Reading file: {file}')
				header_conf = 'infer'
				if not self.config['has_header']:
					header_conf = None

				df = pd.read_csv(file, engine="pyarrow", header=header_conf)
				col_list = ['column_' + str(x) for x in range(1,df.shape[1]+1)]
				df = df.set_axis(col_list, axis='columns')

				#self.log('\n' + 'All data:\n---------------------------\n')
				#self.log(df)

				self.populate_collections(df)
				self.populate_edges(df)

				client = ArangoClient(self.arango_host)
				db = client.db(self.arango_database, self.arango_username, self.arango_password)

				self.write_collections(db)
				self.write_edges(db)
				self.log(f'\nDone in {str(time.time()-f_start_time)} seconds.\n-------------------------------')

			self.log(f'\nFinished importing all files in {str(time.time()-start_time)} seconds.')
		except Exception as e:
			logging.error(traceback.format_exc())
			self.log(str(traceback.format_exc()))
			return ('1',self.logs)

		return ('0',self.logs)


Importer().start_import()
