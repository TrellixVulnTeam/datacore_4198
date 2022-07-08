goto comment
import pandas as pd
import json
import time
import sys, os
import argostranslate.package, argostranslate.translate
from arango import ArangoClient

arango_host = 'http://127.0.0.1:8529/'
arango_database = 'db_' + 'db1'
arango_username = 'root'
arango_password = '123456789'

config = {
    "file_name": "USDJPY_Candlestick_15_M_BID_01.01.2018-31.12.2018.csv",
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

start_time = time.time()
header_conf = 'infer'
if not config['has_header']:
	header = None

df = pd.read_csv(config['file_name'], engine="pyarrow", header=header_conf)
col_list = ['column_' + str(x) for x in range(1,df.shape[1]+1)]
df = df.set_axis(col_list, axis='columns')

print('\n' + 'All data:\n---------------------------\n')
print(df.head())


session_key = str(round((time.time()-1656924275) * 10000))
doc_key = 0

def generate_key():
	global doc_key
	doc_key += 1
	return f'{session_key}.{doc_key}'
	
def cast_fields(source):
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

def translate_fields(source):
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

for col in config['collections']:
	#select required columns from dataframe
	col['data'] = df.iloc[:,col['fields_indecies']]
	#change columns names
	col['data'] = col['data'].set_axis(col['fields_names'], axis='columns')
	#remove duplicate rows based on identity_fields
	col['data'] = col['data'].drop_duplicates(col['identity_fields'],keep= 'first')
	#add _key column
	col['data']['_key'] = col['data'].apply(lambda x: generate_key(), axis=1)
	#add _active column
	col['data'] = col['data'].assign(_active=True)
	#cast collection fields to type and format
	col['data'] = cast_fields(col)
	#translate collection fields if needed
	col['data'] = translate_fields(col)
	print('\n' + col['name'] + ' data:\n---------------------------\n')
	print(col['data'])

for edge in config['edges']:
	#select required columns from dataframe
	edge['data'] = df.iloc[:,edge['fields_indecies']]
	#change columns names
	edge['data'] = edge['data'].set_axis(edge['fields_names'], axis='columns')
	for col in config['collections']:
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
	edge['data'] = edge['data'].drop_duplicates(edge['identity_fields'] + ['_from','_to'],keep= 'first')
	
	#cast edge fields to type and format
	edge['data'] = cast_fields(edge)
	#translate edge fields if needed
	edge['data'] = translate_fields(edge)

	#add _key column
	edge['data']['_key'] = edge['data'].apply(lambda x: generate_key(), axis=1)
	print('\n' + edge['name'] + ' data:\n---------------------------\n')
	print(edge['data'])


client = ArangoClient(arango_host)
db = client.db(arango_database, arango_username, arango_password)
for col in config['collections']:
	arango_collection = db.collection(col['name'])
	arango_collection.import_bulk(json.loads(col['data'].to_json(orient='records')))

for edge in config['edges']:
	arango_collection = db.collection(edge['name'])
	arango_collection.import_bulk(json.loads(edge['data'].to_json(orient='records')))

print(f'Done in {str(time.time()-start_time)} seconds.')
:comment
@echo off
SET mypath=%0
SET "pypath=%mypath%.py"
echo %mypath%
C:\Users\Public\python\python.exe C:\Users\Public\python\Lib\parse_import_batch.py %mypath%
@echo on
C:\Users\Public\python\python.exe %pypath%
pause
