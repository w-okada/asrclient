cd ..\typescript\
call npm run webpack:worklet:prod
call npm run build:prod
cd %~dp0

rd /s /q "node_modules\asr-client-typescript-client-lib"

mkdir node_modules\asr-client-typescript-client-lib\dist

xcopy ..\typescript\package.json node_modules\asr-client-typescript-client-lib\

xcopy /E /I ..\typescript\dist node_modules\asr-client-typescript-client-lib\dist\

