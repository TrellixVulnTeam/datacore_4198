import json
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models

# Create your models here.

class DataField(models.Model):
    english_name = models.CharField(max_length=70)
    arabic_name = models.CharField(max_length=70)
    indexed = models.BooleanField(default=True)
    Types = (
        ('String', 'نص'),
        ('Number', 'رقم'),
        ('Date', 'تاريخ'),
        ('Bool', 'حقيقة'),
        ('Array', 'لائحة'),
        ('Object', 'شيء')
    )
    date_type = models.CharField(max_length=6, choices=Types)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, blank=True, null=True)
    object_id = models.PositiveIntegerField(blank=True, null=True)
    owner = GenericForeignKey()

    # bank = models.ForeignKey(Bank, on_delete=models.CASCADE, blank=True, null=True)
    # relation = models.ForeignKey(Relation, on_delete=models.CASCADE, blank=True, null=True)

    def __str__(self):
        return self.english_name + '_' + self.arabic_name

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)

class Bank(models.Model):
    english_name = models.CharField(max_length=70)
    arabic_name = models.CharField(max_length=70)
    icon_class = models.CharField(max_length=70, blank=True, null=True)
    description = models.CharField(max_length=250, blank=True, null=True)
    data_fields = GenericRelation(DataField)

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)

class Relation(models.Model):
    english_name = models.CharField(max_length=70)
    arabic_name = models.CharField(max_length=70)
    from_bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='fromBank')
    to_bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='toBank')
    data_fields = GenericRelation(DataField)

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)

class View(models.Model):
    english_name = models.CharField(max_length=70)
    arabic_name = models.CharField(max_length=70)
    compressed = models.BooleanField(default=False)
    data_fields = models.ManyToManyField(DataField)

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)
