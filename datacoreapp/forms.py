from faulthandler import disable
from pickle import FALSE
from . import models
from . import widgets
from django import forms
import datetime

class BankForm(forms.Form):
    english_name = forms.CharField(max_length=70, label='الاسم الأجنبي', required=True, strip=True)
    english_name.widget.attrs.update({
        'onkeypress':'validate_en(event)',
        'autocomplete':'off'
    })
    arabic_name = forms.CharField(max_length=70, label='الإسم العربي', required=True)
    arabic_name.widget.attrs.update({
        'onkeypress':'validate_ar(event)',
        'autocomplete':'off'
    })
    icon_class = forms.Field(widget=widgets.IconPickerWidget, label='الشعار', required=False)
    description = forms.CharField(max_length=250, widget=forms.Textarea, label='الوصف', required=False)
    description.widget.attrs.update({
        'rows':'2',
        'autocomplete':'off'
    })
    data_fields = forms.Field(widget=widgets.DataFieldsWidget, label='', required=False)

    def __init__(self, *args, **kwargs):
        super(BankForm, self).__init__(*args, **kwargs)
        for name in self.fields.keys():
            self.fields[name].widget.attrs.update({
                'class': 'form-control',
            })
    
    def set_entity(self, entity):
        self.fields['english_name'].widget.attrs.update({
            'disabled':'true'
        })
        self.fields['arabic_name'].widget.attrs.update({
            'disabled':'true'
        })
        self.fields['english_name'].initial = entity.english_name
        self.fields['arabic_name'].initial = entity.arabic_name
        self.fields['description'].initial = entity.description
        self.fields['icon_class'].initial = entity.icon_class
    

class RelationForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(RelationForm, self).__init__(*args, **kwargs)
        ## add a "form-control" class to each form input
        ## for enabling bootstrap
        for name in self.fields.keys():
            self.fields[name].widget.attrs.update({
                'class': 'form-control',
            })

    class Meta:
        model = models.Relation
        fields = ("__all__")


class ViewForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(ViewForm, self).__init__(*args, **kwargs)
        ## add a "form-control" class to each form input
        ## for enabling bootstrap
        for name in self.fields.keys():
            self.fields[name].widget.attrs.update({
                'class': 'form-control',
            })

    class Meta:
        model = models.View
        fields = ("__all__")