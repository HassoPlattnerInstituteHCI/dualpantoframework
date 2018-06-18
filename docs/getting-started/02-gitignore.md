# [Getting Started](README.md) - Step 2
## The .gitignore file

Create a `.gitignore` file to exclude unwanted files from git:
```Makefile
# the downloaded dependencies
node_modules/

# log files
*.log
npm-debug.log*

# system files
.DS_STORE

# editor files
.vscode/*
```

And don't forget to add your own ignore rules if files from your editor or other tools would otherwise end up in your commit.

Next: [Step 3 - Setup NPM](03-npm.md)
