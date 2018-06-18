# [Getting Started](README.md) - Step 1
## Setup your git repo

If you already have a git repo, create a new empty branch:
```sh
git checkout --orphan your-branch-name

# THIS WILL REMOVE ALL FILES IN THE DIRECTORY
git reset --hard
git clean -xf
```

If you don't have a git repo yet, create a new one:
```sh
git init your-repo-name
cd your-repo-name
```

Next: [Step 2 - The .gitignore file](02-gitignore.md)
