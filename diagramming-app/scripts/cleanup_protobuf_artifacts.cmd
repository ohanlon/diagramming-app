@echo Cleaning up local protobuf/tooling artifacts
echo This will attempt to remove tools/protoc, tools/tmp and tools/plugins directories from the repo directory.
echo Make sure you have no important files in these directories before running.
rd /s /q "%~dp0..\tools\protoc" 2>nul || echo protoc dir not present or could not be removed
rd /s /q "%~dp0..\tools\tmp" 2>nul || echo tmp dir not present or could not be removed
rd /s /q "%~dp0..\tools\plugins" 2>nul || echo plugins dir not present or could not be removed
echo Cleanup attempted. Inspect working tree to confirm.
exit /b 0
