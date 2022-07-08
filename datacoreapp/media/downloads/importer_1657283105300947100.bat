goto comment
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
	arango_database = 'db_' + 'db1'
	arango_username = 'root'
	arango_password = '123456789'
	config = {
    "file_name": "Sample-Spreadsheet-5000-rows.csv",
    "has_header": True,
    "import_all_files": True,
    "used_fields": [
        0
    ],
    "collections": [
        {
            "index": 0,
            "name": "col_person",
            "name_ar": "\u0627\u0641\u0631\u0627\u062f",
            "fields_indecies": [
                0
            ],
            "fields_names": [
                "f_name"
            ],
            "fields": [
                {
                    "name": "f_name",
                    "name_ar": "\u0627\u0644\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": False,
                    "ff_index": 0
                }
            ],
            "identity_fields": []
        }
    ],
    "edges": []
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
		
	def cast_fields(self,source):
		boolean_map = {'1':True,'true':True,'True':True,'TRUE':True,'yes':True,'Yes':True,'YES':True,'ok':True,'Ok':True,'OK':True,'نعم':True,'صح':True,'صحيح':True,'ايجابي':True,'إيجابي':True,
					'0':False,'false':False,'False':False,'FALSE':False,'no':False,'No':False,'NO':False,'not':False,'Not':False,'NOT':False,'كلا':False,'خطأ':False,'خطا':False,'خاطئ':False,'سلبي':False}

		for field in source['fields']:
			if field['type'] == 'String':
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: str(x))
			elif field['type'] == 'Number':
				source['data'][field['name']] = source['data'][field['name']].apply(pd.to_numeric, errors='raise')
			elif field['type'] == 'Date':
				source['data'][field['name']] = source['data'][field['name']].apply(pd.to_datetime(format=field['format'], exact=False), errors='raise')
			elif field['type'] == 'Bool':
				source['data'][field['name']] = source['data'][field['name']].map(boolean_map)
		
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
				source['data'][field['name']] = source['data'][field['name']].apply(lambda x: translation.translate(x))

		return source['data']

	def populate_collections(self,df):
		self.log('Manipulating collections...')
		for col in self.config['collections']:
			#select required columns from dataframe
			col['data'] = df.iloc[:,col['fields_indecies']]
			#change columns names
			col['data'] = col['data'].set_axis(col['fields_names'], axis='columns')
			#remove duplicate rows based on identity_fields
			if(len(col['identity_fields'])>0):
				col['data'] = col['data'].drop_duplicates(col['identity_fields'],keep= 'first')
			#add _key column
			col['data']['_key'] = col['data'].apply(lambda x: self.generate_key(), axis=1)
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
			
			#remove duplicate rows based on identity_fields, _from and _to
			if(len(edge['identity_fields'])>0):
				edge['data'] = edge['data'].drop_duplicates(edge['identity_fields'] + ['_from','_to'],keep= 'first')
			
			#cast edge fields to type and format
			edge['data'] = self.cast_fields(edge)
			#translate edge fields if needed
			edge['data'] = self.translate_fields(edge)

			#add _key column
			edge['data']['_key'] = edge['data'].apply(lambda x: self.generate_key(), axis=1)
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
			self.logs += str(traceback.format_exc())
			return ('1',self.logs)

		return ('0',self.logs)


# Start import

Importer().start_import()

:comment
@echo off
SET mypath=%0
SET "pypath=%mypath%.py"
echo %mypath%
C:\Users\Public\python\python.exe C:\Users\Public\python\Lib\parse_import_batch.py %mypath%
@echo on
C:\Users\Public\python\python.exe %pypath%
pause
