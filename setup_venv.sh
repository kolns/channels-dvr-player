#!/bin/bash

# Live TV Player Setup Script
# This script sets up the Python virtual environment and installs dependencies

set -e  # Exit on any error

echo "🚀 Setting up Live TV Player..."
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Error: Python is not installed or not in PATH"
    echo "Please install Python 3.7+ and try again"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "✅ Found Python: $($PYTHON_CMD --version)"

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "📋 Python version: $PYTHON_VERSION"

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Removing old one..."
    rm -rf venv
fi

$PYTHON_CMD -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "❌ Error: requirements.txt not found"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo "=================================="
echo ""
echo "🎉 Your Live TV Player is ready!"
echo ""
echo "To start the application:"
echo "  1. Run: source venv/bin/activate"
echo "  2. Run: python run.py"
echo "  3. Open: http://localhost:7734"
echo ""
echo "Or use the activation script:"
echo "  ./activate_venv.sh"
echo ""
fi

# Create virtual environment
echo -e "${YELLOW}Creating virtual environment...${NC}"
python3 -m venv $VENV_NAME

# Check if virtual environment was created successfully
if [ ! -d "$VENV_NAME" ]; then
    echo -e "${RED}Error: Failed to create virtual environment${NC}"
    exit 1
fi

# Activate the virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source $VENV_NAME/bin/activate

# Create a symlink for python -> python3 in the virtual environment
echo -e "${YELLOW}Creating python symlink...${NC}"
cd $VENV_NAME/bin
if [ ! -L python ] && [ ! -f python ]; then
    ln -s python3 python
    echo -e "${GREEN}Created symlink: python -> python3${NC}"
else
    echo -e "${GREEN}python command already exists in virtual environment${NC}"
fi

# Go back to original directory
cd - > /dev/null

# Upgrade pip to latest version
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Display success message and instructions
echo -e "${GREEN}✓ Virtual environment '${VENV_NAME}' created successfully!${NC}"
echo ""
echo -e "${YELLOW}To activate the virtual environment:${NC}"
echo "  source ${VENV_NAME}/bin/activate"
echo ""
echo -e "${YELLOW}To deactivate the virtual environment:${NC}"
echo "  deactivate"
echo ""
echo -e "${YELLOW}To verify python command works:${NC}"
echo "  python --version"
echo "  python3 --version"
echo ""
echo -e "${GREEN}You can now use 'python' instead of 'python3' in this virtual environment!${NC}"
