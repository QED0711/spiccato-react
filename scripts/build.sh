#!/bin/bash

rm -r dist;
npx tsc -p tsconfig.json;

cp ./package.json ./dist;