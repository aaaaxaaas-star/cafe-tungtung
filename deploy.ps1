# Character encoding adjustment for Thai language output in PowerShell console
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Clear-Host
Write-Host "==================================================" -ForegroundColor Gold
Write-Host "      Coffee POS GitHub Deployment Helper         " -ForegroundColor Gold
Write-Host "==================================================" -ForegroundColor Gold
Write-Host ""

# 1. Check if Git is installed
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (!$gitCheck) {
    Write-Host "❌ ไม่พบ Git ติดตั้งในระบบของคุณ!" -ForegroundColor Red
    Write-Host "กรุณาดาวน์โหลดและติดตั้ง Git จาก: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "หลังจากติดตั้งเสร็จสิ้น ให้รันสคริปต์นี้ใหม่อีกครั้ง" -ForegroundColor Yellow
    Write-Host ""
    $openUrl = Read-Host "กด Enter เพื่อเปิดหน้าดาวน์โหลด Git บนเบราว์เซอร์ (หรือกด N เพื่อยกเลิก)"
    if ($openUrl -ne "n" -and $openUrl -ne "N") {
        Start-Process "https://git-scm.com/download/win"
    }
    Exit
}

Write-Host "✅ พบ Git ในระบบเรียบร้อย!" -ForegroundColor Green
Write-Host ""

# 2. Ask for GitHub username
$username = Read-Host "กรุณากรอก GitHub Username ของคุณ (เช่น somsak-dev)"
$username = $username.Trim()
if ([string]::IsNullOrEmpty($username)) {
    Write-Host "❌ ไม่สามารถรันต่อได้: กรุณากรอก Username!" -ForegroundColor Red
    Read-Host "กด Enter เพื่อปิด..."
    Exit
}

$repoName = "cafe-tungtung"
Write-Host ""
Write-Host "📦 ลิงก์ที่ต้องการอัปโหลด: https://github.com/$username/$repoName" -ForegroundColor Cyan
Write-Host ""
Write-Host "📢 คำเตือน: คุณต้องทำการสร้าง Repository เปล่าชื่อ '$repoName' บนเว็บ GitHub ก่อน!" -ForegroundColor Yellow
Write-Host "👉 ลิงก์สร้างคลัง: https://github.com/new" -ForegroundColor Cyan
Write-Host "โดยระบุ Repository name เป็น: cafe-tungtung (ไม่ต้องเลือกสร้าง README หรือ .gitignore บนเว็บ)" -ForegroundColor Gray
Write-Host ""

$ready = Read-Host "หากสร้างคลังบน GitHub เรียบร้อยแล้ว ให้กด Enter เพื่อเริ่มการอัปโหลดโค้ด..."

# 3. Initialize Git Repository
if (!(Test-Path .git)) {
    Write-Host "📁 กำลังเริ่มสร้าง Git Local Repository..." -ForegroundColor Yellow
    git init
}

# Set branch name to main
git branch -M main

# 4. Git Add and Commit
Write-Host "➕ กำลังเพิ่มไฟล์ของแอปลง Git Index (คัดแยกข้อมูลด้วย .gitignore)..." -ForegroundColor Yellow
git add .

Write-Host "💾 กำลังบันทึกประวัติการพัฒนา (Commit)..." -ForegroundColor Yellow
git commit -m "Initial commit - Coffee POS System"

# 5. Config Remote
$remoteCheck = git remote get-url origin 2>$null
if ($remoteCheck) {
    git remote remove origin
}
git remote add origin "https://github.com/$username/$repoName.git"

# 6. Push to GitHub
Write-Host "🚀 กำลังส่งไฟล์ทั้งหมดขึ้น GitHub (ระบบอาจขึ้นป๊อปอัปให้เข้าสู่ระบบ GitHub)..." -ForegroundColor Green
git push -u origin main -f

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 อัปโหลดไฟล์เสร็จสมบูรณ์เรียบร้อยแล้ว!" -ForegroundColor Green
    Write-Host "คุณสามารถเข้าดูโค้ดและผูกเข้ากับ Vercel ได้ที่ลิงก์นี้:" -ForegroundColor Green
    Write-Host "🔗 https://github.com/$username/$repoName" -ForegroundColor Gold
} else {
    Write-Host ""
    Write-Host "❌ เกิดข้อผิดพลาดในระหว่างการ Push ข้อมูลขึ้น GitHub" -ForegroundColor Red
    Write-Host "กรุณาตรวจสอบว่า:" -ForegroundColor Yellow
    Write-Host "1. ได้สร้าง Repository ชื่อ '$repoName' บน GitHub แล้วจริงหรือไม่" -ForegroundColor Yellow
    Write-Host "2. พิมพ์ชื่อผู้ใช้ (Username) ถูกต้องหรือไม่" -ForegroundColor Yellow
    Write-Host "3. ได้ทำการล็อกอินยืนยันตัวตนใน Git บนเครื่องเรียบร้อยแล้ว" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "กด Enter เพื่อปิดหน้าต่างนี้..."
