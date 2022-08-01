import sys
import os

filepath = sys.argv[1]
print(filepath)
data = ''
with open(filepath, 'r') as file:
    data = file.read()

filename = os.path.basename(filepath) + '.py'
data = data.split(':comment')[0].split("\n",1)[1]

f = open(os.path.join(os.path.dirname(filepath),filename), 'w', encoding="utf-8")
f.write(data)
f.close()