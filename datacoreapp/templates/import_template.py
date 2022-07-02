import pandas as pd
import json

config = {{config|safe}}
df = pd.read_csv(config['file_name'], engine="pyarrow")
print('\n' + 'All data:\n---------------------------\n')
print(df.head())

for col in config['collections']:
	col['data'] = df.iloc[:,col['fields_indecies']]
	print('\n' + col['name'] + ' data:\n---------------------------\n')
	print(col['data'].head())

for edge in config['edges']:
	edge['data'] = df.iloc[:,edge['fields_indecies']]
	print('\n' + edge['name'] + ' data:\n---------------------------\n')
	print(edge['data'].head())

#print(df)
#payload = json.loads(df.to_json(orient='records'))
#print(payload)
