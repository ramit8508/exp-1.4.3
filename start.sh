#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Ticket Booking System - Setup${NC}"
echo -e "${GREEN}================================${NC}\n"

# Check if Redis is installed
echo -e "${YELLOW}Checking Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}Redis is not installed!${NC}"
    echo -e "Install Redis with:"
    echo -e "  Ubuntu/Debian: sudo apt install redis-server"
    echo -e "  macOS: brew install redis"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}Starting Redis...${NC}"
    if command -v systemctl &> /dev/null; then
        sudo systemctl start redis
    else
        redis-server --daemonize yes
    fi
    sleep 2
fi

# Verify Redis is running
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓ Redis is running${NC}\n"
else
    echo -e "${RED}Failed to start Redis${NC}"
    exit 1
fi

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}\n"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}\n"
else
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi

# Start the server
echo -e "${GREEN}Starting server...${NC}\n"
npm start
