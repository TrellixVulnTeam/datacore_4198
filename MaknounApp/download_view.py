import json
import logging
import os
import shutil
import time
import traceback
from django.http import FileResponse, HttpResponse
from django.views import View


class DownloadView(View):

    def get(self, request):
        try:
            downloads_folder = os.path.dirname(os.path.realpath(__file__)) + '\\media\\downloads\\'
            try:
                for f in os.listdir(downloads_folder):
                    filePath = os.path.join(downloads_folder, f)
                    if os.path.getmtime(filePath) < time.time() - 60 * 60:
                        if os.path.isfile(filePath):
                            print(f)
                            os.remove(filePath)
            except Exception as e:
                print('Failed to delete %s. Reason: %s' % (downloads_folder, e))

            filename = request.GET.get('id')
            full_file_path = os.path.join(downloads_folder, filename)
            if filename == 'python.zip':
                full_file_path = os.path.join(os.path.dirname(os.path.realpath(__file__)) + '\\media\\keep\\', filename)

            if not filename or not os.path.isfile(full_file_path):
                return HttpResponse(
                        json.dumps({"code":  '1' , "message": 'الملف المطلوب غير موجود' }),
                        content_type="application/json"
                    )
            
            response = FileResponse(open(full_file_path, 'rb'))
            return response
            
        except Exception as e:
            logging.error(traceback.format_exc())
            code = '1'
            return HttpResponse(
                    json.dumps({"code":  code , "message": str(e) }),
                    content_type="application/json")