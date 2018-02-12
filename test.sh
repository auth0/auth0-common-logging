#!/bin/bash

NODE_VERSION=$(node -v | cut -d. -f 1)

if [ ${NODE_VERSION} == 'v8' ]; then
  TEST_FILES=$(find ./test -name "*test*.js")
else
  TEST_FILES=$(find ./test -name "*test*.js" ! -name "*test*node8*.js")
fi

./node_modules/.bin/mocha ${TEST_FILES}
