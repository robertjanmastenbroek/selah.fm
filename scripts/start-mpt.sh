#!/bin/bash
# Start MoneyPrinterTurbo in API mode for Selah.fm outreach video generation
# Usage: ./scripts/start-mpt.sh
#
# Prerequisites:
#   - Python 3.11+ with pip
#   - ffmpeg installed (brew install ffmpeg)
#   - imagemagick installed (brew install imagemagick)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MPT_DIR="$PROJECT_DIR/mpt-service"
CONFIG_SRC="$PROJECT_DIR/mpt-config.toml"
CONFIG_DST="$MPT_DIR/config.toml"

echo "🎬 Starting MoneyPrinterTurbo for Selah.fm outreach..."

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 not found. Install: brew install python@3.11"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Install: brew install ffmpeg"
    exit 1
fi

# Check if MPT is cloned
if [ ! -f "$MPT_DIR/main.py" ]; then
    echo "❌ MPT not found at $MPT_DIR"
    echo "   Clone it: git clone --depth 1 https://github.com/harry0703/MoneyPrinterTurbo.git $MPT_DIR"
    exit 1
fi

# Load env vars from .env.local
ENV_FILE="$PROJECT_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading env vars from .env.local..."
    set -a
    source "$ENV_FILE"
    set +a
fi

# Generate config.toml with actual API keys
echo "🔧 Generating MPT config..."
sed -e "s|\${DEEPSEEK_API_KEY}|${DEEPSEEK_API_KEY}|g" \
    -e "s|\${PEXELS_API_KEY}|${PEXELS_API_KEY}|g" \
    "$CONFIG_SRC" > "$CONFIG_DST"
echo "   Config written to $CONFIG_DST"

# Install Python dependencies if needed
cd "$MPT_DIR"
if [ ! -d ".venv" ] && [ ! -f "venv/bin/activate" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "📦 Installing dependencies..."
pip install -q -r requirements.txt 2>&1 | tail -1

# Fix ImageMagick policy (allow text rendering)
if [ -f /etc/ImageMagick-6/policy.xml ]; then
    sudo sed -i '/<policy domain="path" rights="none" pattern="@\*"/d' /etc/ImageMagick-6/policy.xml 2>/dev/null || true
fi
if [ -f /opt/homebrew/etc/ImageMagick-7/policy.xml ]; then
    sed -i '' '/<policy domain="path" rights="none" pattern="@\*"/d' /opt/homebrew/etc/ImageMagick-7/policy.xml 2>/dev/null || true
fi

echo ""
echo "🚀 Starting MPT API on http://localhost:8080"
echo "   API docs: http://localhost:8080/docs"
echo "   Press Ctrl+C to stop"
echo ""

python3 main.py
