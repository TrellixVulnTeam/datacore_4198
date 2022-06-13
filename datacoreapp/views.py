import imp
from django import template
from django.http import HttpResponse
from . import models
from django.http import *
from django.template import RequestContext

context = {
		'pages' : []
	}

class Page():
	english_name = ''
	arabic_name = ''
	icon = ''
	selected = False
	template = ''
	childs = []
	selected_child = None

	def __init__(self, en, ar, ico, sel, temp, ch):
		self.english_name = en
		self.arabic_name = ar
		self.icon = ico
		self.selected = sel
		self.template = temp
		self.childs = ch
	
	def validate(self):
		self.selected_child = next((x for x in self.childs if x.selected == True), None)

def build_dom():
	home_page = Page('Home', 'الرئيسيّة', 'bi-house-heart-fill', False, 'home', None)
	banks_page = Page('Banks', 'بنوك المعلومات', 'bi-hdd-stack-fill', False, 'banks', [])
	relations_page = Page('Relations', 'العلاقات', 'bi-diagram-3-fill', False, 'relations', [])
	import_page = Page('Import', 'استيراد البيانات', 'bi-file-earmark-arrow-down-fill', False, 'import', None)
	views_page = Page('Views', 'ملفّات محرّك البحث', 'bi-book-half', False, 'views', [])
	search_engine_page = Page('SearchEngine', 'محرّك البحث', 'bi-search', False, 'search_engine', None)
	advanced_search_page = Page('AdvancedSearch', 'بحث متقدّم', 'bi-binoculars-fill', False, 'advanced_search', None)
	graph_search_page = Page('GraphSearch', 'بحث في العلاقات', 'bi-bezier2', False, 'graph_search', None)
	users_page = Page('Users', 'المستخدمين', 'bi-people-fill', False, 'admin', None)
	settings_page = Page('Settings', 'الإعدادات', 'bi-gear-fill', False, 'settings', None)

	banks = models.Bank.objects.all()
	for b in banks.iterator():
		banks_page.childs.append(Page(b.english_name, b.arabic_name, b.icon_class, False, 'banks', None))
	
	relations = models.Relation.objects.all()
	for r in relations.iterator():
		relations_page.childs.append(Page(r.english_name, r.arabic_name, None, False, 'relations', None))
	
	views = models.View.objects.all()
	for v in views.iterator():
		views_page.childs.append(Page(v.english_name, v.arabic_name, None, False, 'views', None))
	
	context['pages'] = [home_page, banks_page, relations_page, import_page, views_page, search_engine_page, advanced_search_page, graph_search_page, users_page, settings_page]

def get_context():
	build_dom()
	return context