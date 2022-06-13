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

@register.filter(name='fetch_many')
def fetch_many(value):
    if value:
        return value.all().iterator()
    return []

@register.filter(name='selected_if_equal')
def selected_if_equal(value, arg):
    if value and arg and value == arg:
        return "true"
    return "false"

@register.filter(name='get_item')
def get_item(dictionary, key):
    return dictionary[key]