goto comment
{{pycode|safe}}
:comment
@echo off
SET mypath=%0
SET "pypath=%mypath%.py"
echo %mypath%
C:\Users\Public\python\python.exe C:\Users\Public\python\Lib\parse_import_batch.py %mypath%
@echo on
C:\Users\Public\python\python.exe %pypath%
pause
