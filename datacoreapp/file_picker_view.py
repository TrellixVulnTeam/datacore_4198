import json
import logging
import os
import shutil
import time
import traceback
from django.forms import Form
from django.http import FileResponse, HttpResponse
from django.views import View
import psutil


class FilePickerView(View):

    def post(self, request):
        try:
            form_data = Form(request.POST)
            base_dir = form_data.data['base']
            parentdir = os.path.dirname(base_dir)
            if parentdir==base_dir:
                parentdir = '/'
            
            output = f'<ul id="ul-navigation" style="list-style-type: none;padding: 0px;" data-parent="{parentdir}">'
            
            if(base_dir=='/'):
                for disk in psutil.disk_partitions():
                    output+=f'<li class="partition" onclick="focus_file(event)" data-value="{disk.device.replace(os.sep, "/")}" ondblclick="file_picker_file_selected(event)"><span class="bi-hdd-fill pl10"></span>{disk.device}</li>'
            else:
                output+=f'<li class="folder" onclick="focus_file(event)" data-value="..." ondblclick="file_picker_file_selected(event)"><span class="bi-folder-fill pl10"></span>...</li>'
                for file in os.listdir(base_dir):
                    path = os.path.join(base_dir, file)
                    if os.path.isfile(path):
                        output+=f'<li class="file" onclick="focus_file(event)" data-value="{path.replace(os.sep, "/")}" ondblclick="file_picker_file_selected(event)"><span class="bi-file-earmark-binary-fill pl10"></span>{file}</li>'
                    elif os.path.isdir(path):
                        output+=f'<li class="folder" onclick="focus_file(event)" data-value="{path.replace(os.sep, "/")}" ondblclick="file_picker_file_selected(event)"><span class="bi-folder-fill pl10"></span>{file}</li>'
                
            output+='</ul>'
            return HttpResponse(
                        output,
                        content_type="text/plain"
                    )
        except Exception as e:
            logging.error(traceback.format_exc())
            code = '1'
            return HttpResponse(
                    json.dumps({"code":  code , "message": str(e) }),
                    content_type="application/json")