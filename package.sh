#!/bin/bash
rm -rf out
mkdir -p out
OUTFILE="out/dv360.js"
SOURCES=("02_util.js" "05_api_util.js" "01_dv360.js")
touch $OUTFILE
for f in ${SOURCES[@]}; do
  echo "/** $f **/" >> $OUTFILE
  cat "src/$f" >> $OUTFILE
  echo "/** end $f" >> $OUTFILE
done