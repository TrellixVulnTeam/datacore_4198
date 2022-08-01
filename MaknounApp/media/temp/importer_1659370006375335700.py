import json
import time
import sys, os
import datetime
import threading
import logging
import traceback
from turtle import st
import gc
import ray
#os.environ["MODIN_ENGINE"] = "ray"
import pandas as pd
#import argostranslate.package, argostranslate.translate
from arango import ArangoClient
from concurrent.futures import ThreadPoolExecutor

def write_adata_async(args):
	colname = args[0]
	arango_collection = args[1]
	data = args[2]
	print(f'writing {len(data)} documents into {colname}...')
	jsondata = json.loads(data.to_json(orient='records'))
	arango_collection.import_bulk(jsondata)
	del jsondata
	gc.collect()

class Importer():
	arango_host = 'http://127.0.0.1:8529/'
	arango_database = 'db_Maknoun_' + 'db1'
	arango_username = 'root'
	arango_password = '123456789'
	config = {
    "file_name": "D:/5m.csv",
    "has_header": True,
    "import_all_files": False,
    "used_fields": [
        0,
        11,
        5,
        7,
        1
    ],
    "collections": [
        {
            "index": 2,
            "name": "col_persons",
            "name_ar": "\u0627\u0641\u0631\u0627\u062f",
            "fields_indecies": [
                0,
                11,
                5
            ],
            "fields_names": [
                "f_col_persons_name",
                "f_col_persons_passport",
                "f_col_persons_dob"
            ],
            "fields": [
                {
                    "name": "f_col_persons_name",
                    "name_ar": "\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 0
                },
                {
                    "name": "f_col_persons_passport",
                    "name_ar": "\u062c\u0648\u0627\u0632_\u0633\u0641\u0631",
                    "type": "Number",
                    "format": "",
                    "match": False,
                    "ff_index": 11
                },
                {
                    "name": "f_col_persons_dob",
                    "name_ar": "\u0627\u0644\u0648\u0644\u0627\u062f\u0629",
                    "type": "Date",
                    "format": "%m/%d/%y",
                    "match": False,
                    "ff_index": 5
                }
            ],
            "identity_fields": [
                "f_col_persons_name"
            ]
        },
        {
            "index": 3,
            "name": "col_hotel",
            "name_ar": "\u0641\u0646\u062f\u0642",
            "fields_indecies": [
                1
            ],
            "fields_names": [
                "f_col_hotel_name"
            ],
            "fields": [
                {
                    "name": "f_col_hotel_name",
                    "name_ar": "\u0627\u0644\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 1
                }
            ],
            "identity_fields": [
                "f_col_hotel_name"
            ]
        }
    ],
    "edges": [
        {
            "name": "edge_visit",
            "name_ar": "\u0632\u064a\u0627\u0631\u0629",
            "from_col": 2,
            "to_col": 3,
            "fields_indecies": [
                7
            ],
            "fields_names": [
                "f_edge_visit_vdate"
            ],
            "fields": [
                {
                    "name": "f_edge_visit_vdate",
                    "name_ar": "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u0632\u064a\u0627\u0631\u0629",
                    "type": "Date",
                    "format": "%m/%d/%y",
                    "match": False,
                    "ff_index": 7
                }
            ],
            "identity_fields": []
        }
    ]
}
	session_key = str(round(time.time()))
	doc_key = 0
	logs = ''
	key_map = {}
	current_collection = ''
	translation_model = None
	boolean_map = {'1':True,'true':True,'True':True,'TRUE':True,'yes':True,'Yes':True,'YES':True,'ok':True,'Ok':True,'OK':True,'نعم':True,'صح':True,'صحيح':True,'ايجابي':True,'إيجابي':True,
				'0':False,'false':False,'False':False,'FALSE':False,'no':False,'No':False,'NO':False,'not':False,'Not':False,'NOT':False,'كلا':False,'خطأ':False,'خطا':False,'خاطئ':False,'سلبي':False}

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
		
	def to_array(self, value, splitter, itemType, dateformat):
		result = []
		if value and isinstance(value, list):
			for v in value:
				temp = ''
				if type(v) is bytes:
					temp= str(v,encoding="utf-8")
				else:
					temp = str(v)
				array = temp.split(splitter)
				for x in array:
					if itemType == 'String':
						result.append(self.to_string(x))
					elif itemType == 'Number':
						result.append(self.to_numeric(x))
					elif itemType == 'Date':
						result.append(self.to_date(x, dateformat))
					elif itemType == 'Bool':
						result.append(x.map(self.boolean_map))
				return result
		elif value and len(str(value).strip())>0:
			temp = ''
			if type(value) is bytes:
				temp= str(value,encoding="utf-8")
			else:
				temp = str(value)
			array = temp.split(splitter)
			for x in array:
				if itemType == 'String':
					result.append(self.to_string(x))
				elif itemType == 'Number':
					result.append(self.to_numeric(x))
				elif itemType == 'Date':
					result.append(self.to_date(x, dateformat))
				elif itemType == 'Bool':
					result.append(x.map(self.boolean_map))
			return result
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
			lst = list(v)
			firstv = lst[0]
			for i in lst:
				self.key_map[i] =  f'{self.current_collection}/{firstv}'
			return firstv
		return None

	def group_by_identity(self, source):
		non_identity_fields = [item for item in source['fields_names'] if item not in source['identity_fields']]
		non_identity_fields_agg = {}
		if non_identity_fields and len(non_identity_fields)>0:
			for f in non_identity_fields:
				non_identity_fields_agg[f] = self.map_to_list_or_single
		
		self.current_collection = source['name']
		non_identity_fields_agg['_key'] = self.map_to_first	
		result = source['data'].groupby(source['identity_fields'], as_index = False).agg(non_identity_fields_agg)
		source['key_map'] = self.key_map.copy()
		self.key_map = {}
		return result
	
	def cast_fields(self,source):
		for field in source['fields']:
			if field['type'] == 'String':
				source['data'][field['name']].astype('str',copy=False)
			elif field['type'] == 'Number':
				source['data'][field['name']] = pd.to_numeric(source['data'][field['name']], errors='raise')
			elif field['type'] == 'Date':
				source['data'][field['name']] = pd.to_datetime(source['data'][field['name']], format=field['format'], exact=False, errors='raise')
			elif field['type'] == 'Bool':
				source['data'][field['name']] = source['data'][field['name']].map(self.boolean_map)
			elif field['type'].startswith('Array'):
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.to_array(x,field['format'][:1],field['type'].split('_')[1],field['format'][1:]))
		
		return source['data']

	def load_translation_model(self):
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
		self.translation_model = from_lang.get_translation(to_lang)

	def translate_fields(self,source):
		for field in source['fields']:
			if field['format'] == 'translate':
				if not self.translation_model:
					self.load_translation_model()
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: self.apply_translation(x))
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

			#add _key column
			col['data'].reset_index(inplace=True)
			col['data']['index'] = col['data']['index'].map(f'{self.session_key}.{\{\}}'.format)
			
			#change columns names
			col['fields_names'].insert(0,'_key')
			col['data'] = col['data'].set_axis(col['fields_names'], axis='columns')
			
			#cast collection fields to type and format
			col['data'] = self.cast_fields(col)
			
			#translate collection fields if needed
			col['data'] = self.translate_fields(col)

			#merge duplicate rows based on identity_fields
			if(len(col['identity_fields'])>0):
				col['data'] = self.group_by_identity(col)

			#add _active & _creation columns
			col['data']['_active'] = True
			col['data']['_creation'] = pd.Timestamp.now()

			self.log('\n' + col['name'] + ' data:\n---------------------------\n')
			self.log(col['data'])

	def populate_edges(self,df):
		self.log('Manipulating edges...')
		for edge in self.config['edges']:
			#select required columns from dataframe
			edge['data'] = df.iloc[:,edge['fields_indecies']]

			#change columns names
			edge['data'] = edge['data'].set_axis(edge['fields_names'], axis='columns')
			
			#add _key column
			edge['data'].reset_index(inplace=True)
			edge['data']['index'] = edge['data']['index'].map(f'{self.session_key}.{\{\}}'.format)
			edge['data'].rename(columns={'index': '_key'}, inplace = True)
			
			#add _from column
			edge['data'].eval('_from=_key', inplace=True)
			
			#add _to column
			edge['data'].eval('_to=_key', inplace=True)
			
			for col in self.config['collections']:
				if col['index'] == edge['from_col']:
					edge['data']['_from'] = edge['data']['_from'].map(col["key_map"])
				elif col['index'] == edge['to_col']:
					edge['data']['_to'] = edge['data']['_to'].map(col["key_map"])
			
			#cast edge fields to type and format
			edge['data'] = self.cast_fields(edge)
			
			#translate edge fields if needed
			edge['data'] = self.translate_fields(edge)
			
			#merge duplicate rows based on identity_fields
			if(len(edge['identity_fields'])>0):
				edge['identity_fields'] = edge['identity_fields'].extend(['_from','_to'])
				edge['data'] = self.group_by_identity(edge)
						
			#add _active & _creation columns
			edge['data']['_active'] = True
			edge['data']['_creation'] = pd.Timestamp.now()

			self.log('\n' + edge['name'] + ' data:\n---------------------------\n')
			self.log(edge['data'])

	def pop(self, df, values, axis=1):
		if axis == 0:
			if isinstance(values, (list, tuple)):
				popped_rows = df.loc[values]
				df.drop(values, axis=0, inplace=True)
				return popped_rows
			elif isinstance(values, (int)):
				popped_row = df.loc[values].to_frame().T
				df.drop(values, axis=0, inplace=True)
				return popped_row
			else:
				print('values parameter needs to be a list, tuple or int.')
		elif axis == 1:
			# current df.pop(values) logic here
			return df.pop(values)

	def write_collections(self,db, tpe):
		self.log('Writing collections to arangodb...')
		for col in self.config['collections']:
			self.write_data(col,db,tpe)

	def write_edges(self,db, tpe):
		self.log('Writing edges to arangodb...')
		for edge in self.config['edges']:
			self.write_data(edge,db,tpe)

	def write_data(self, source, db, tpe):
		arango_collection = db.collection(source['name'])
		size = 100000
		list_of_dfs = [source['data'].loc[i:i+size-1,:] for i in range(0, len(source['data']),size)]
		for d in list_of_dfs:
			tpe.submit(write_adata_async, [source['name'],arango_collection,d])
		del source['data']
		gc.collect()

	# def write_frame_async(self, colname, arango_collection, data):
	# 	self.log(f'writing {len(data)} documents into {colname}...')
	# 	jsondata = json.loads(data.to_json(orient='records'))
	# 	arango_collection.import_bulk(jsondata)
	# 	del jsondata
	# 	gc.collect()

	def start_import(self):
		try:
			# self.log('Initializing Ray execution environment...')
			# ray.init()

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

				df = pd.read_csv(file, engine='pyarrow', header=header_conf)
				col_list = ['column_' + str(x) for x in range(1,df.shape[1]+1)]
				df = df.set_axis(col_list, axis='columns')

				self.populate_collections(df)
				self.populate_edges(df)

				del df
				gc.collect()

				client = ArangoClient(self.arango_host)
				db = client.db(self.arango_database, self.arango_username, self.arango_password)

				tpe = ThreadPoolExecutor(max_workers=10) 
				self.write_collections(db,tpe)
				self.write_edges(db,tpe)
				tpe.shutdown(wait=True)

				self.log(f'\nDone in {str(time.time()-f_start_time)} seconds.\n-------------------------------')

			self.log(f'\nFinished importing all files in {str(time.time()-start_time)} seconds.')
		except Exception as e:
			logging.error(traceback.format_exc())
			self.log(str(traceback.format_exc()))
			return ('1',self.logs)

		return ('0',self.logs)


# Start import
