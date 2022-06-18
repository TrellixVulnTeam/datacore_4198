from pickle import FALSE
from django import template

register = template.Library()

@register.filter(name='split')
def split(value, arg):
    if value and value.strip():
        parts = value.split(arg)
        result = []
        for p in parts:
            if p and p.strip():
                result.append(p.strip())
        return result
    return []

@register.filter(name='translate_permission')
def translate_permission(value):
    if value and value.strip():
        pages_dictionary= {
            'Home':'الرئيسيّة',
            'Banks':'بنوك المعلومات',
            'Relations':'العلاقات',
            'Import':'استيراد البيانات',
            'Views':'ملفّات محرّك البحث',
            'SearchEngine':'محرّك البحث',
            'AdvancedSearch':'بحث متقدّم',
            'GraphSearch':'بحث في العلاقات',
            'Users':'المستخدمين',
            'Settings':'الإعدادات',
        }
        return pages_dictionary[value.strip()]
    return value

@register.filter(name='fetch_all')
def fetch_all(value):
    if value:
        return value.all().iterator()
    return []

@register.filter(name='iterator')
def iterator(value):
    if value:
        return value.iterator()
    return []

@register.filter(name='select')
def select(array, value):
    selection = []
    if array and value:
        for a in array:
            selection.append(getattr(a, value))
    return selection

@register.filter(name='fetch_all_count')
def fetch_all_count(value):
    if value:
        return len(value.all().iterator())
    return 0

@register.filter(name='fetch_by_name')
def fetch_by_name(value, field_name):
    if value:
        try:
            return getattr(value, field_name).all().iterator()
        except Exception as e:
            return []
    return []

@register.filter(name='fetch_all_not_empty')
def fetch_all_not_empty(value):
    if value:
        if value.count() > 0:
            return True;
    return FALSE

@register.filter(name='equals')
def equals(value, arg):
    if value and arg and value == arg:
        return "true"
    return "false"

@register.filter(name='if_equals_else')
def if_equals_else(value, args):
    if value and args:
        arg_list = [arg.strip() for arg in args.split(',')]
        if value == arg_list[0]:
            return arg_list[1]
        else:
            return arg_list[2]
    return ""

@register.filter(name='if_else')
def if_equals(value, args):
    if value and args:
        arg_list = [arg.strip() for arg in args.split(',')]
        if value:
            return arg_list[0]
        else:
            return arg_list[1]
    return ""

@register.filter(name='get_item')
def get_item(dictionary, key):
    return dictionary[key]

@register.filter(name='str_or_default')
def str_or_default(str, default):
    if not str or len(str) == 0:
        return default;
    return str

@register.filter(name='str2bool')
def str2bool(v):
  return v.lower() in ("yes", "true", "t", "1")

@register.filter(name='array_to_string_no_brackets')
def array_to_string_no_brackets(v):
    result = ''
    if v and len(v)>0:
        for i in v:
            result += str(i) + ','
        result = result[:-1]
    return result