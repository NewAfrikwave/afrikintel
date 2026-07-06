#!/bin/bash
# ============================================================
# Build the Afrikintel Go agent for all platforms
# Requires Go 1.21+ installed: https://go.dev/dl/
# ============================================================
set -e

cd "$(dirname "$0")/.."

OUT_DIR="public"
SRC="public/afrikintel-agent.go"

if ! command -v go &> /dev/null; then
  echo "Error: Go is not installed. Install from https://go.dev/dl/"
  exit 1
fi

echo "Building Afrikintel agent for all platforms..."

PLATFORMS=(
  "linux/amd64"
  "linux/arm64"
  "darwin/amd64"
  "darwin/arm64"
  "windows/amd64"
)

for PLATFORM in "${PLATFORMS[@]}"; do
  GOOS=$(echo $PLATFORM | cut -d'/' -f1)
  GOARCH=$(echo $PLATFORM | cut -d'/' -f2)
  OUTPUT="$OUT_DIR/afrikintel-agent-$GOOS-$GOARCH"
  if [ "$GOOS" = "windows" ]; then
    OUTPUT="$OUTPUT.exe"
  fi

  echo "  Building $GOOS/$GOARCH → $OUTPUT"
  GOOS=$GOOS GOARCH=$GOARCH CGO_ENABLED=0 go build -ldflags="-s -w" -o "$OUTPUT" "$SRC"
done

echo "Done! Binaries are in $OUT_DIR/"
echo ""
echo "One-line install on a Linux server:"
echo "  curl -fsSL https://your-afrikintel-host/afrikintel-agent-linux-amd64 -o /usr/local/bin/afrikintel-agent"
echo "  chmod +x /usr/local/bin/afrikintel-agent"
echo "  AFRIKINTEL_MONITOR_ID=xxx AFRIKINTEL_HOST=https://your-afrikintel-host afrikintel-agent"
