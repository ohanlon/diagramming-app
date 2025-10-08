@echo Regenerate npm lockfiles for client and server
echo Running npm install in project root (this will update package-lock.json)
npm install
echo Now regenerating server lockfile
cd server
npm install
echo Lockfiles should now be updated. Commit the resulting package-lock.json files.
exit /b 0
