# ประกาศตัวแปร
$OUTPUT_ZIP = "chrome-extension.zip"

# สั่ง zip โดยใช้แฟล็ก -r (Recurse) เพื่อรักษาโครงสร้างโฟลเดอร์
# และใช้แฟล็ก -x (Exclude) ในการกรองไฟล์ออก
zip -r $OUTPUT_ZIP . `
  -x "*.git*" `
  -x "*.DS_Store*" `
  -x "*node_modules*" `
  -x "package.json" `
  -x "package-lock.json" `
  -x "*.zip" `
  -x "build.sh" `
  -x "build.ps1"