from distutils.command.config import config
import functools
import json
import time
import sys, os, platform
import datetime
import threading
import logging
import traceback
from turtle import st, title
import gc
import ray
from rich.progress import Progress
#os.environ["MODIN_ENGINE"] = "ray"
import pandas as pd
#import argostranslate.package, argostranslate.translate
from arango import ArangoClient
from concurrent.futures import ThreadPoolExecutor

def synchronized(wrapped):                                                      
    lock = threading.Lock()                                                     
    id(lock)                                                        
    @functools.wraps(wrapped)                                                   
    def _wrap(*args, **kwargs):                                                 
        with lock:               
            result = wrapped(*args, **kwargs)       
            return result                                                       
    return _wrap  

class Writer():

	def write_adata_async(self,args):
		colname = args[0]
		arango_collection = args[1]
		data = args[2]
		total = args[3]
		logger = args[4]
		logger.log(f'writing {len(data)} documents into {colname}...')
		jsondata = json.loads(data.to_json(orient='records'))
		arango_collection.import_bulk(jsondata)
		logger.log_items[colname]['write'] += len(data)
		logger.log(f'Done writing {len(data)} documents into {colname}...')
		del data
		del jsondata
		gc.collect()

class WriteHandler():
	
	arango_host = 'http://127.0.0.1:8529/'
	arango_database = 'db_Maknoun_' + 'db1'
	arango_username = 'root'
	arango_password = '123456789'
	db = None
	threadPoolExecuter = None
	batch_size = 50000

	def __init__(self):
		client = ArangoClient(self.arango_host)
		self.db = client.db(self.arango_database, self.arango_username, self.arango_password)
		self.threadPoolExecuter = ThreadPoolExecutor(max_workers=10) 

	def write_data(self, source, logger):
		srcname = source["name"]
		logger.log(f'Writing {srcname} records into ArangoDB...')
		arango_collection = self.db.collection(srcname)
		list_of_dfs = [source['data'].loc[i:i+self.batch_size-1,:] for i in range(0, len(source['data']),self.batch_size)]
		logger.log_items[srcname]['write_total'] = len(source['data'])
		for d in list_of_dfs:
			self.threadPoolExecuter.submit(Writer().write_adata_async, [srcname,arango_collection,d,self.batch_size,logger]).add_done_callback(self.done)
		self.threadPoolExecuter.shutdown(wait=True)
		logger.log_items[srcname]['write'] = logger.log_items[srcname]['write_total']
		logger.log(f'Done writing all documents into {srcname}...')
		del source['data']
		gc.collect()

	def done(self, task):
		if task._exception:
			print(task._exception)
			logging.error(traceback.format_exc())

class Logger():

	logs = ''
	process_logs = ''
	log_items = {}
	clear = None

	def __init__(self,):
		if platform.system() == 'Windows':
			self.clear = lambda:os.system('cls')
		else:
			self.clear = lambda:os.system('clear')

	@synchronized
	def log(self, msg):
		self.logs+=str(msg) + '\n'
		if 'progress' in self.log_items:
			self.log_items['progress'].console.print(msg)
		else:
			print(msg)
		self.process_logs = ''
		for e in self.log_items.keys():
			if e != 'progress':
				item = self.log_items[e]
				if 'progress' in self.log_items and 'process_progress' in item:
					self.log_items['progress'].update(item['process_progress'],total=item['process_total'],completed=item['process'],refresh=True)
					self.log_items['progress'].update(item['write_progress'],total=item['write_total'],completed=item['write'],refresh=True)
			# self.process_logs+=self.print_progress(item['process'],item['process_total'],title=f'{e} data parse')
			# self.process_logs+=self.print_progress(item['write'],item['write_total'],title=f'{e} data write') + '\n'
		# self.clear()
		# sys.stdout.write(self.process_logs)
		# sys.stdout.flush()

	def print_progress(self, step, total_steps, bar_width=60, title="", print_perc=True):
		# UTF-8 left blocks: 1, 1/8, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8
		utf_8s = ["█", "▏", "▎", "▍", "▌", "▋", "▊", "█"]
		perc = 100 * float(step) / float(total_steps)
		max_ticks = bar_width * 8
		num_ticks = int(round(perc / 100 * max_ticks))
		full_ticks = num_ticks / 8      # Number of full blocks
		part_ticks = num_ticks % 8      # Size of partial block (array index)
		
		disp = bar = ""                 # Blank out variables
		bar += utf_8s[0] * int(full_ticks)  # Add full blocks into Progress Bar
		
		# If part_ticks is zero, then no partial block, else append part char
		if part_ticks > 0:
			bar += utf_8s[part_ticks]
		
		# Pad Progress Bar with fill character
		bar += "▒" * int((max_ticks/8 - float(num_ticks)/8.0))
		
		if len(title) > 0:
			disp = title + ": "         # Optional title to progress display
		
		# Print progress bar in green: https://stackoverflow.com/a/21786287/6929343
		disp += "\x1b[0;32m"            # Color Green
		disp += bar                     # Progress bar to progress display
		disp += "\x1b[0m"               # Color Reset
		if print_perc:
			# If requested, append percentage complete to progress display
			if perc > 100.0:
				perc = 100.0            # Fix "100.04 %" rounding error
			disp += " {:6.2f}".format(perc) + " %"
		
		# Output to terminal repetitively over the same line using '\r'.
		return disp + '\n'

class DataPrcessor():

	key_map = {}
	current_collection = ''
	translation_model = None
	boolean_map = {'1':True,'true':True,'True':True,'TRUE':True,'yes':True,'Yes':True,'YES':True,'ok':True,'Ok':True,'OK':True,'نعم':True,'صح':True,'صحيح':True,'ايجابي':True,'إيجابي':True,
				'0':False,'false':False,'False':False,'FALSE':False,'no':False,'No':False,'NO':False,'not':False,'Not':False,'NOT':False,'كلا':False,'خطأ':False,'خطا':False,'خاطئ':False,'سلبي':False}

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
			if self.current_collection:
				for i in lst:
					self.key_map[i] =  f'{self.current_collection}/{firstv}'
			return firstv
		return None

	def group_by_identity(self, source, config):
		non_identity_fields = [item for item in source['fields_names'] if item not in source['identity_fields']]
		non_identity_fields_agg = {}
		if non_identity_fields and len(non_identity_fields)>0:
			for f in non_identity_fields:
				non_identity_fields_agg[f] = self.map_to_list_or_single
		
		if config:
			self.current_collection = source['name']
		else:
			self.current_collection = None

		non_identity_fields_agg['_key'] = self.map_to_first	
		result = source['data'].groupby(source['identity_fields'], as_index = False, group_keys = False, sort = False).agg(non_identity_fields_agg)
		
		if config:
			for edge in config['edges']:
				for col in config['collections']:
					if col['index'] == edge['from_col']:
						edge['from_key_map'] = self.key_map.copy()
					elif col['index'] == edge['to_col']:
						edge['to_key_map'] = self.key_map.copy()
			self.key_map = {}
			gc.collect()

		return result
	
	def cast_fields(self,source):
		for field in source['fields']:
			if field['type'] == 'String':
				source['data'][field['name']].astype('category',copy=False)
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

class Manipulator():
	dataPrcessor = None
	session_key = None
	logger = None
	writeHandler = None
	config = None

	def __init__(self, session_key_, config_, logger_):
		self.config = config_
		self.logger = logger_
		self.session_key = session_key_
		self.dataPrcessor = DataPrcessor()
		self.writeHandler = WriteHandler()

	def Manipulate_collection(self, col):
		self.logger.log(f'Manipulating {col["name"]}...')

		#add _key column
		col['data'].reset_index(inplace=True)
		col['data']['index'] = col['data']['index'].map(f'{self.session_key}.{{}}'.format)
		self.logger.log_items[col["name"]]['process'] += 1
		self.logger.log(f'Manipulating {col["name"]}, done changing columns names...')

		#change columns names
		col['fields_names'].insert(0,'_key')
		col['data'] = col['data'].set_axis(col['fields_names'], axis='columns')
		self.logger.log_items[col["name"]]['process'] += 1
		self.logger.log(f'Manipulating {col["name"]}, done adding _key column...')
		
		#cast collection fields to type and format
		col['data'] = self.dataPrcessor.cast_fields(col)
		self.logger.log_items[col["name"]]['process'] += 1
		self.logger.log(f'Manipulating {col["name"]}, done casting fileds...')
		
		#translate collection fields if needed
		col['data'] = self.dataPrcessor.translate_fields(col)
		self.logger.log_items[col["name"]]['process'] += 1
		self.logger.log(f'Manipulating {col["name"]}, done translating fileds...')

		#merge duplicate rows based on identity_fields
		if(len(col['identity_fields'])>0):
			col['data'] = self.dataPrcessor.group_by_identity(col, self.config)
		self.logger.log_items[col["name"]]['process'] += 1
		self.logger.log(f'Manipulating {col["name"]}, done merging duplicates by identity...')

		#add _active & _creation columns
		col['data']['_active'] = True
		col['data']['_creation'] = pd.Timestamp.now()
		self.logger.log_items[col["name"]]['process'] += 1
		self.logger.log(f'Manipulating {col["name"]}, done adding _active and _creation columns...')


		self.logger.log_items[col["name"]]['process'] = self.logger.log_items[col["name"]]['process_total']
		self.logger.log(f'Manipulating {col["name"]}, done processing fileds...')
		self.logger.log('\n' + col['name'] + ' data:\n---------------------------\n')
		self.logger.log(col['data'])

		#send data write request
		self.writeHandler.write_data(col,self.logger)

	def Manipulate_edge(self, edge):
		self.logger.log(f'Manipulating {edge["name"]}...')

		#change columns names
		edge['data'] = edge['data'].set_axis(edge['fields_names'], axis='columns')
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done changing columns names...')
		
		#add _key column
		edge['data'].reset_index(inplace=True)
		edge['data']['index'] = edge['data']['index'].map(f'{self.session_key}.{{}}'.format)
		edge['data'].rename(columns={'index': '_key'}, inplace = True)
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done adding _key column...')
		
		#add _from column
		edge['data'].eval('_from=_key', inplace=True)
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done adding _from column...')
		
		#add _to column
		edge['data'].eval('_to=_key', inplace=True)
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done adding _to column...')
		
		#filling _from and _to columns
		fromFilled = False
		toFilled = False
		while(not fromFilled or not toFilled):
			if not fromFilled and 'from_key_map' in edge:
				self.logger.log(f'Populating _from key for edge {edge["name"]}...')
				edge['data']['_from'] = edge['data']['_from'].map(edge["from_key_map"])
				self.logger.log_items[edge["name"]]['process'] += 1
				self.logger.log(f'Manipulating {edge["name"]}, done filling _from column...')
				fromFilled = True
			elif not toFilled and 'to_key_map' in edge:
				self.logger.log(f'Populating _to key for edge {edge["name"]}...')
				edge['data']['_to'] = edge['data']['_to'].map(edge["to_key_map"])
				self.logger.log_items[edge["name"]]['process'] += 1
				self.logger.log(f'Manipulating {edge["name"]}, done filling _to column...')
				toFilled = True
			time.sleep(0.5)
		
		#cast edge fields to type and format
		edge['data'] = self.dataPrcessor.cast_fields(edge)
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done casting fileds...')
		
		#translate edge fields if needed
		edge['data'] = self.dataPrcessor.translate_fields(edge)
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done translating fileds...')
		
		#merge duplicate rows based on identity_fields
		if(len(edge['identity_fields'])>0):
			edge['identity_fields'] = edge['identity_fields'].extend(['_from','_to'])
			edge['data'] = self.dataPrcessor.group_by_identity(edge, None)
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done merging duplicates by identity...')
					
		#add _active & _creation columns
		edge['data']['_active'] = True
		edge['data']['_creation'] = pd.Timestamp.now()
		self.logger.log_items[edge["name"]]['process'] += 1
		self.logger.log(f'Manipulating {edge["name"]}, done adding _active and _creation columns...')

		self.logger.log_items[edge["name"]]['process'] = self.logger.log_items[edge["name"]]['process_total']
		self.logger.log(f'Manipulating {edge["name"]}, done processing fileds...')
		self.logger.log('\n' + edge['name'] + ' data:\n---------------------------\n')
		self.logger.log(edge['data'])

		#send data write request
		self.writeHandler.write_data(edge,self.logger)

class Importer():
	config = {
    "file_name": "D:/5m Sales Records.csv",
    "has_header": True,
    "import_all_files": False,
    "used_fields": [
        0,
        8,
        5,
        1,
        7,
        9,
        3,
        2,
        4,
        11
    ],
    "collections": [
        {
            "index": 2,
            "name": "col_person",
            "name_ar": "\u0627\u0641\u0631\u0627\u062f",
            "fields_indecies": [
                0,
                8,
                5,
                1
            ],
            "fields_names": [
                "f_col_person_name",
                "f_col_person_mobile",
                "f_col_person_dob",
                "f_col_person_adress"
            ],
            "fields": [
                {
                    "name": "f_col_person_name",
                    "name_ar": "\u0627\u0644\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 0
                },
                {
                    "name": "f_col_person_mobile",
                    "name_ar": "\u0627\u0644\u0647\u0627\u062a\u0641",
                    "type": "Number",
                    "format": "",
                    "match": False,
                    "ff_index": 8
                },
                {
                    "name": "f_col_person_dob",
                    "name_ar": "\u0627\u0644\u0648\u0644\u0627\u062f\u0629",
                    "type": "Date",
                    "format": "%m/%d/%y",
                    "match": False,
                    "ff_index": 5
                },
                {
                    "name": "f_col_person_adress",
                    "name_ar": "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 1
                }
            ],
            "identity_fields": [
                "f_col_person_name",
                "f_col_person_adress"
            ]
        },
        {
            "index": 3,
            "name": "col_hotels",
            "name_ar": "\u0627\u0644\u0641\u0646\u0627\u062f\u0642",
            "fields_indecies": [
                2,
                4,
                11
            ],
            "fields_names": [
                "f_col_hotels_hname",
                "f_col_hotels_adress",
                "f_col_hotels_rooms"
            ],
            "fields": [
                {
                    "name": "f_col_hotels_hname",
                    "name_ar": "\u0627\u0644\u0627\u0633\u0645",
                    "type": "String",
                    "format": "",
                    "match": True,
                    "ff_index": 2
                },
                {
                    "name": "f_col_hotels_adress",
                    "name_ar": "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
                    "type": "String",
                    "format": "",
                    "match": False,
                    "ff_index": 4
                },
                {
                    "name": "f_col_hotels_rooms",
                    "name_ar": "\u0627\u0644\u063a\u0631\u0641",
                    "type": "Number",
                    "format": "",
                    "match": False,
                    "ff_index": 11
                }
            ],
            "identity_fields": [
                "f_col_hotels_hname"
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
                7,
                9,
                3
            ],
            "fields_names": [
                "f_edge_visit_vdate",
                "f_edge_visit_days",
                "f_edge_visit_notes"
            ],
            "fields": [
                {
                    "name": "f_edge_visit_vdate",
                    "name_ar": "\u062a\u0627\u0631\u064a\u062e_\u0627\u0644\u0632\u064a\u0627\u0631\u0629",
                    "type": "Date",
                    "format": "%m/%d/%y",
                    "match": False,
                    "ff_index": 7
                },
                {
                    "name": "f_edge_visit_days",
                    "name_ar": "\u0627\u0644\u0627\u064a\u0627\u0645",
                    "type": "Number",
                    "format": "",
                    "match": False,
                    "ff_index": 9
                },
                {
                    "name": "f_edge_visit_notes",
                    "name_ar": "\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
                    "type": "String",
                    "format": "",
                    "match": False,
                    "ff_index": 3
                }
            ],
            "identity_fields": []
        }
    ]
}
	logger = Logger()

	def write_collections(self,db, tpe):
		self.log('Writing collections to arangodb...')
		for col in self.config['collections']:
			self.write_data(col,db,tpe)

	def write_edges(self,db, tpe):
		self.log('Writing edges to arangodb...')
		for edge in self.config['edges']:
			self.write_data(edge,db,tpe)

	def start_import(self):
		try:
			# self.logger.log('Initializing Ray execution environment...')
			# ray.init()
			session_key = str(round(time.time()))
			start_time = time.time()
			files = []
			self.logger.log('Files to import:')
			if self.config['import_all_files']:
				dirname = os.path.dirname(os.path.abspath(self.config['file_name']))
				for f in os.listdir(dirname):
					if os.path.isfile(os.path.join(dirname,f)) and f.endswith('.csv'):
						self.logger.log(f'{f}')
						files.append(os.path.abspath(os.path.join(dirname,f)))
			else:
				files.append(os.path.abspath(self.config['file_name']))

			self.logger.log('-------------------------------\n')

			for file in files:
				f_start_time = time.time()
				self.logger.log(f'Reading file: {file}')
				header_conf = 'infer'
				if not self.config['has_header']:
					header_conf = None

				df = pd.read_csv(file, engine='pyarrow', header=header_conf)
				col_list = ['column_' + str(x) for x in range(1,df.shape[1]+1)]
				df = df.set_axis(col_list, axis='columns')

				threadPoolExecuter = ThreadPoolExecutor(max_workers=5) 

				with Progress() as progress:
					self.logger.log_items['progress'] = progress
					self.logger.log('Manipulating collections...')
					for col in self.config['collections']:
						self.logger.log_items[col['name']] = {'process':0, 'process_total': 6, 'write':0, 'write_total':100, 'process_progress' : progress.add_task(f"[green]{col['name']} data parse...", total=6), 'write_progress' : progress.add_task(f"[green]{col['name']} data write...", total=100)}
						col['data'] = df.iloc[:,col['fields_indecies']]
						man = Manipulator(session_key,self.config, self.logger)
						threadPoolExecuter.submit(man.Manipulate_collection, col)

					self.logger.log('Manipulating edges...')
					for edge in self.config['edges']:
						self.logger.log_items[edge['name']] = {'process':0, 'process_total': 10, 'write':0, 'write_total':100, 'process_progress' : progress.add_task(f"[green]{edge['name']} data parse...", total=10), 'write_progress' : progress.add_task(f"[green]{edge['name']} data write...", total=100)}
						edge['data'] = df.iloc[:,edge['fields_indecies']]
						man = Manipulator(session_key, self.config, self.logger)
						threadPoolExecuter.submit(man.Manipulate_edge, edge)

					self.logger.log('Clearing initial dataframe...')
					del df
					gc.collect()

					threadPoolExecuter.shutdown(wait=True)

				self.config = None
				gc.collect()

				self.logger.log(f'\nDone in {str(time.time()-f_start_time)} seconds.\n-------------------------------')

			self.logger.log(f'\nFinished importing all files in {str(time.time()-start_time)} seconds.')
		except Exception as e:
			logging.error(traceback.format_exc())
			self.logger.log(str(traceback.format_exc()))
			return ('1',self.logger.logs)

		return ('0',self.logger.logs)


# Start import
Importer().start_import()