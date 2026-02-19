#!/usr/bin/env bash
# Installs the Habit Tracker desktop icon.
# Usage: bash install-desktop-icon.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_DIR="${XDG_DESKTOP_DIR:-$HOME/Desktop}"

# Fallback to German desktop name if default doesn't exist
if [ ! -d "$DESKTOP_DIR" ]; then
  DESKTOP_DIR="$HOME/Schreibtisch"
fi

if [ ! -d "$DESKTOP_DIR" ]; then
  echo "Kein Desktop-Ordner gefunden ($HOME/Desktop oder $HOME/Schreibtisch)."
  echo "Erstelle $HOME/Desktop ..."
  mkdir -p "$HOME/Desktop"
  DESKTOP_DIR="$HOME/Desktop"
fi

# Create the .desktop file with resolved paths
DESKTOP_FILE="$DESKTOP_DIR/habit-tracker.desktop"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=Habit Tracker
Comment=Tägliche Gewohnheiten tracken
Exec=xdg-open ${APP_DIR}/index.html
Icon=${APP_DIR}/icon.svg
Type=Application
Categories=Utility;
Terminal=false
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"

# Mark as trusted on GNOME-based desktops
if command -v gio &> /dev/null; then
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
fi

echo "Desktop-Icon erfolgreich erstellt: $DESKTOP_FILE"
echo "Die App öffnet sich im Standardbrowser."
