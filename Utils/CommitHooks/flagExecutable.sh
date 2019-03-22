#!/bin/sh
if [[ "$OSTYPE" != "win32" ]]; then 
  chmod +x ./.git/hooks/pre-commit
else
  echo "nothing to do for win"  
fi