#!/bin/bash -e

cd "$(dirname $0)/.."

if [ ! -d simaware-tracon-project ]; then
  git clone https://github.com/vatsimnetwork/simaware-tracon-project.git
  cd simaware-tracon-project
else
  cd simaware-tracon-project
  git pull
fi
rm -f TRACONBoundaries.geojson
node compiler.js
cp TRACONBoundaries.geojson ../public/data/