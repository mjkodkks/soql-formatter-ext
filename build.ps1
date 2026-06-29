# Output file name
$OUTPUT_ZIP = "chrome-extension.zip"

# Create zip with -r (Recurse) to preserve folder structure
# and -x (Exclude) to filter out unwanted files
zip -r $OUTPUT_ZIP . `
  -x "*.git*" `
  -x "*.DS_Store*" `
  -x "*node_modules*" `
  -x "package.json" `
  -x "package-lock.json" `
  -x "*.zip" `
  -x "build.sh" `
  -x "build.ps1"