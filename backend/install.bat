@echo off
echo ====================================================
echo  Velocity Prime Native Messaging Installer
echo ====================================================
echo.

set /p ExtID="Please enter the Extension ID from chrome://extensions: "
if "%ExtID%"=="" (
    echo Error: Extension ID cannot be empty.
    pause
    exit /b
)

:: Get current folder path safely
set "DIR=%~dp0"
set "DIR=%DIR:\=\\%"

:: Create the JSON File
echo {> velocity_prime_native.json
echo   "name": "com.velocityprime.bridge",>> velocity_prime_native.json
echo   "description": "Velocity Prime Native Bridge",>> velocity_prime_native.json
echo   "path": "bridge_run.bat",>> velocity_prime_native.json
echo   "type": "stdio",>> velocity_prime_native.json
echo   "allowed_origins": [>> velocity_prime_native.json
echo     "chrome-extension://%ExtID%/">> velocity_prime_native.json
echo   ]>> velocity_prime_native.json
echo }>> velocity_prime_native.json

:: Create the batch wrapper that runs Python
echo @echo off> bridge_run.bat
echo python "%~dp0bridge.py" %%*>> bridge_run.bat

:: Add to Windows Registry
echo Registering Native Host in Windows Registry...
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.velocityprime.bridge" /ve /t REG_SZ /d "%~dp0velocity_prime_native.json" /f

echo.
echo ====================================================
echo Install Complete! You can close this window.
echo ====================================================
pause
