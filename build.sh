#!/bin/bash

# Define the output zip file name
OUTPUT_ZIP="chrome-extension.zip"

# Define directories and files to exclude from the zip file
EXCLUDE_LIST=(
    "*.DS_Store*"
    "*/.DS_Store*"
    "*.git*"
    "*/.git*"
    "*.gitignore*"
    "node_modules/*"
    "*/node_modules/*"
    "package.json"
    "package-lock.json"
    "*.zip",
    "build.sh",
    "chrome-extension.zip"
)

# Build the exclude argument string for the zip command
EXCLUDE_ARGS=""
for item in "${EXCLUDE_LIST[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS -x \"$item\""
done

# Remove old zip if it exists
if [ -f "$OUTPUT_ZIP" ]; then
    rm "$OUTPUT_ZIP"
fi

# Run the zip command from the current directory
echo "Compressing extension project..."
eval "zip -r \"$OUTPUT_ZIP\" . $EXCLUDE_ARGS"

echo "Done! Saved as $OUTPUT_ZIP"
