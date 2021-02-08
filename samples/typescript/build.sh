#!/bin/sh
set -ex
rm -rf dist
tsc
cp package.json package-lock.json dist
cd dist
npm install --only=prod