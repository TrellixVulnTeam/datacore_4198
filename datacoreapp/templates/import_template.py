import pandas as pd
import json
import time

config = {{config|safe}}
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
	fields_by_type = {'String':[],'Number':[],'Bool':[]}
	for field in source['fields']:
		if field['type'] == 'String':
			fields_by_type['String'].append(field['name'])
		elif field['type'] == 'Number':
			fields_by_type['Number'].append(field['name'])
		elif field['type'] == 'Date':
			pd.to_datetime(source['data'][field['name']], format=field['date_format'], exact=False)
		elif field['type'] == 'Bool':
			fields_by_type['Bool'].append(field['name'])
	
	if len(fields_by_type['String']) > 0:
		source['data'][fields_by_type['String']].astype(str)
	if len(fields_by_type['Number']) > 0:
		pd.to_numeric(source['data'][fields_by_type['Number']], downcast='float')
	if len(fields_by_type['Bool']) > 0:
		source['data'][fields_by_type['Bool']].map(boolean_map)

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
		elif col['index'] == edge['to_col']:
			#add collection _key column as _to to edge
			edge['data'] = edge['data'].join(col['data']['_key'])
			edge['data'] = edge['data'].rename({'_key':'_to'}, axis='columns')
	
	#replacing nan _from and _to fields with the first available key
	edge['data']['_from'] = edge['data']['_from'].fillna(method='ffill')
	edge['data']['_to'] = edge['data']['_to'].fillna(method='ffill')
	
	#remove duplicate rows based on identity_fields, _from and _to
	edge['data'] = edge['data'].drop_duplicates(edge['identity_fields'] + ['_from','_to'],keep= 'first')
	
	#cast edge fields to type and format
	edge['data'] = cast_fields(edge)
	
	#add _key column
	edge['data']['_key'] = edge['data'].apply(lambda x: generate_key(), axis=1)
	print('\n' + edge['name'] + ' data:\n---------------------------\n')
	print(edge['data'])

#print(df)
#payload = json.loads(df.to_json(orient='records'))
#print(payload)
