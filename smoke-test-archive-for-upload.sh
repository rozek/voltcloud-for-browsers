#!/usr/bin/env bash
# **** builds "smoke-test-archive-for-upload.zip" from "smoke-test.html"

rm  smoke-test-archive-for-upload.zip
cp  smoke-test.html index.html
zip smoke-test-archive-for-upload.zip index.html
rm  index.html
