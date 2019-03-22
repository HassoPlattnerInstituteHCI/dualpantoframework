/* eslint-disable */
const fs = require('fs');
const script = "#!/bin/sh\n\
\n\
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep \".jsx\\{0,1\\}$\")\n\
ESLINT=\"$(git rev-parse --show-toplevel)/node_modules/.bin/eslint\"\n\
\n\
if [[ \"$STAGED_FILES\" = \"\" ]]; then\n\
  exit 0\n\
fi\n\
\n\
PASS=true\n\
\n\
printf \"\\nRunning ESLint for JS:\\n\"\n\
\n\
# Check for eslint\n\
if [[ ! -x \"$ESLINT\" ]]; then\n\
  printf \"\\t\\033[41mPlease install ESlint\\033[0m (npm i --save-dev eslint)\"\n\
  exit 1\n\
fi\n\
\n\
for FILE in $STAGED_FILES\n\
do\n\
  \"$ESLINT\" \"$FILE\"\n\
\n\
  if [[ \"$?\" == 0 ]]; then\n\
    printf \"\\033[32mESLint Passed: $FILE\\033[0m\"\n\
  else\n\
    printf \"\\033[41mESLint Failed: $FILE\\033[0m\"\n\
    PASS=false\n\
  fi\n\
  printf \"\\t\"\n\
done\n\
\n\
printf \"\\nESLint complete!\\n\"\n\
\n\
if ! $PASS; then\n\
  printf \"\\033[41mCOMMIT FAILED:\\033[0m Your commit contains files that should pass ESLint but do not. Please fix the ESLint errors and try again.\\n\"\n\
  exit 1\n\
else\n\
  printf \"\\033[42mCOMMIT SUCCEEDED\\033[0m\\n\"\n\
fi\n\
\n\
exit $?";

fs.writeFileSync('./.git/hooks/pre-commit', script);

if (process.platform == 'win32') {
  console.log('skipping chmod for windows');
} else {
  const exec = require('child_process').exec;
  exec('chmod +x ./.git/hooks/pre-commit', (error, stdout, stderr) => {
    if (error) {
      console.log('exec error: ' + error);
    }
  });
}
