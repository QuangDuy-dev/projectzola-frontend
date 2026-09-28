@echo off
chcp 65001 >nul
echo ========================================================
echo       QUY TRINH CAP NHAT GIAO DIEN (CLOUDFLARE PAGES)
echo ========================================================
echo.

echo [1/3] Kiem tra loi va build thu truoc...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Code giao dien dang co loi, khong the build.
    echo Vui long sua loi truoc khi day len!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Commit thay doi vao Git...
git add .
set /p commit_msg="Nhap ghi chu cho lan cap nhat (hoac an Enter): "
if "%commit_msg%"=="" set commit_msg="update: update frontend UI"
git commit -m "%commit_msg%"

echo.
echo [3/3] Day len GitHub...
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   DA DAY LEN GITHUB THANH CONG!
    echo   Cloudflare Pages dang tu dong cap nhat sau 20-30 giay.
    echo ========================================================
) else (
    echo.
    echo [CHU Y] Day code that bai. Vui long kiem tra ket noi hoac quyen GitHub.
)
echo.
pause
