#!/bin/bash
set -eo pipefail

# Install dependencies using npm
npm install --omit=dev

# Build the project
npm run build
