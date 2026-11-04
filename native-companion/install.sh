#!/usr/bin/env bash
# DevLocator Native Messaging Host Installer for Linux
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_NAME="com.devlocator.companion"
PYTHON_SCRIPT="$SCRIPT_DIR/devlocator_host.py"
MANIFEST_TEMPLATE="$SCRIPT_DIR/com.devlocator.companion.json"

chmod +x "$PYTHON_SCRIPT"

# Fixed Extension ID generated from manifest key
DEFAULT_EXTENSION_ID="ijpfnklnedappeonjbbkcplejdbmofke"
EXTENSION_ID="${1:-$DEFAULT_EXTENSION_ID}"

echo "=========================================="
echo "DevLocator Native Companion Installer"
echo "=========================================="
echo "Host Script: $PYTHON_SCRIPT"
echo "Extension ID: $EXTENSION_ID"

# Generate manifest with absolute path to host script
TEMP_MANIFEST="/tmp/${HOST_NAME}.json"
cat > "$TEMP_MANIFEST" <<EOF
{
  "name": "${HOST_NAME}",
  "description": "DevLocator Native Messaging Host for IDE Integration",
  "path": "${PYTHON_SCRIPT}",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://${EXTENSION_ID}/"
  ]
}
EOF

# Target directories on Linux for Google Chrome, Chromium, and Brave
TARGET_DIRS=(
  "$HOME/.config/google-chrome/NativeMessagingHosts"
  "$HOME/.config/chromium/NativeMessagingHosts"
  "$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
)

INSTALLED_COUNT=0
for DIR in "${TARGET_DIRS[@]}"; do
  # Create directory if parent browser config exists
  BROWSER_BASE="$(dirname "$DIR")"
  if [ -d "$BROWSER_BASE" ] || [ "$DIR" = "$HOME/.config/google-chrome/NativeMessagingHosts" ]; then
    mkdir -p "$DIR"
    cp "$TEMP_MANIFEST" "$DIR/${HOST_NAME}.json"
    echo "✓ Installed host manifest to: $DIR/${HOST_NAME}.json"
    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
  fi
done

rm -f "$TEMP_MANIFEST"

echo "------------------------------------------"
if [ "$INSTALLED_COUNT" -gt 0 ]; then
  echo "Installation successful! DevLocator native companion is active."
else
  echo "Warning: No standard browser configuration folders found in ~/.config."
fi
echo "=========================================="

