# DualpantoFramework

[![CircleCI](https://circleci.com/gh/JotaroS/dualpantoframework.svg?style=svg&circle-token=32b766f8a9d2c9a0c612d215322a6dab4aec813d)](https://circleci.com/gh/JotaroS/dualpantoframework)


version 0.1

dev : Oliver Schneider, Jotaro Shigeyama, Alexander Meißner, Nico Böckhoff

firstname.lastname@hpi.de

## Installation
Welcome to the `dualpantoframework` repository!
This repository contains source codes for __reading and writing__ signals to the dualpanto-board, as well as some useful tools to debug and test the pantograph.

In this section, we introduce you how to install the library in your system. Follow these steps to install required dependencies for `dualpantoframework`.

---
### For Linux / macOS system users:
#### 1. Launch terminal.
For macOS, search spotlight for `terminal` or goto Utility folder in your Application folder.
For Linux, it depends on your distribution, but usually you can find `terminal` app from the menu bar of your OS.

#### 2. install `node`
`node` is a Javascript framework. You can do many interesting thing with `node` from web-app to robotics.
`npm` is `node`'s package manager. Using `npm` you can manage many libraries in your project. If you install `node`, `npm` will also be installed in your machine.

Installing `node` requires a "packge manager" in your OS. (Linux: `apt-get`, `yum`, etc. macOS: `brew`)
##### 2.1(m) macOS users: install `brew` first.
- Go to : https://brew.sh/index_ja
- copy-paste command to your terminal:

`/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

- Once installation finished, type `brew doctor` to check if it's working (it may give you some warning but that's fine for now)

##### 2.1(l) Linux users: check your package manager.
- If you already know your package manager, you may proceed to the next step.
- If you are not sure about your package manager, tell your TA about your OS/version.
    - Usually, `ubuntu` distribution has `apt-get` package installer.
    - `CentOS` has `yum`
    - etc...

##### 2.2 Install `git`

`git` is a version tracker.

Some of you may have `git` already when you have your OS installed in your machine.
When you type `git -v` then it it returns error, You need `git` tools to clone and track the repository.

- macOS : type `brew install git`
- Linux : type `sudo (YOUR_PACKAGE MANAGER) git`

Type `git --version` to check if it's working.

##### 2.3 install `node` using terminal
- macOS : type `brew install node`
- Linux : type `sudo (YOUR_PACKAGE MANAGER) node` (Please refer to your package manager instruction.)
    - e.g. ubuntu : `sudo apt-get install node`

##### 2.4 check if `node` is working
- Type `node -v` (type node (space) hyphen v)
- Also, type `npm -v`

If there's no error for both, your `node` is working nice. (Once `node` installed, you will also have `npm` : node package manager.)

#### 3. Install `python 2.7.x`

- for macOS users : If you have __not__ installed python 3.x, your default python should be `python 2.x`. Type `python --version` to check the version.
- for Linux users : You may already have `python`. First, type `python --version`

If your python is running and the version is `2.7.x`, skip to 4.

##### 3.1 If you don't have python 2.7.x
You may uninstalled your python 2.x for some reasons(classes or projects).
If your python is `3.x`, you may need to change the version. We recommend to use `pyenv` which you can easily switch versions of your `python`.

##### 3.2(m) macOS : Install `pyenv`
- Type `brew install pyenv`
- Type `cd ~`

In your home directory, there should be `.bash_profile` shell script. This is the list of scripts executed if you start your terminal.

- Using any of text editor, open `.bash_profile`. `CMD + SHIFT + . ` can visualize hidden file on your Finder (file and directory starting from period means it is hidden file).
- Add scripts below : 

```
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

- Restart the terminal and type `pyenv -v`. If there's no error, `pyenv` is ready.
- Type `pyenv install 2.7.10`
- After installation type `pyenv global 2.7.10`. This switches your python version.
- Type `python --version` to check the version switched to 2.7.x

##### 3.2(l) Linux : Install `pyenv`
- Type `cd ~`
- Type `git clone https://github.com/yyuu/pyenv ~/.pyenv`

Below is example of Ubuntu distribution. Install any of these depencencies using your package manager.

```
sudo apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev
sudo apt-get install -y libreadline-dev libsqlite3-dev wget curl llvm
```
- Type `cd ~`

In your home directory, there should be `.bash_profile` shell script. This is the list of scripts executed if you start your terminal.

- Using any of text editor, open `.bash_profile`. 
- Add scripts below : 

```
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

- Restart the terminal and type `pyenv -v`. If there's no error, `pyenv` is ready.
- Type `pyenv install 2.7.10`
- After installation type `pyenv global 2.7.10`. This switches your python version.
- Type `python --version` to check the version switched to 2.7.x

#### 4. Install `dualpantoframework`

##### 4.1 Clone the repository.

___Clone___ means that you will download the repository in your PC. You may now proceed to the directory you want to working on.
- If you are familiar with the terminal, proceed to your desired working directory for DIS project.

`cd (your DIS directory)`

- If you are ___not___ familiar with the terminal, We recommend you to first clone in your home directory.

`cd ~` (change directory to 'home directory' = `~`)

Then type

`git clone https://github.com/JotaroS/dualpantoframework.git`

Then if you type `ls` , there should be `dualpantoframework` directory in your workspace.

##### 4.2 Build `dualpantoframework`

- Type `cd dualpantorframework`
- You are now in `dualpantoframework` directory. Type `pwd` to make sure you are there.
- Type `npm install` to install packages for `dualpantoframework`
- Type `npm test` to check it's working

If there's no error, your `dualpantoframework` is all set.


##### 4.3 Check what's going on.
After installation, You will have `build` directory, which is originally not in the repository.

This directory is generated when you did `npm install`. Go take a look inside the directory.

```
build
├── Makefile
├── Release
│   ├── obj.target
│   │   └── serial
│   │       └── serial.o
│   └── serial.node
├── binding.Makefile
├── config.gypi
├── gyp-mac-tool
└── serial.target.mk
```

In `Release` direcotry there's `serial.o` exec file. For Linux/macOS users, this is one you need to execute to communicate with the board.
In the most examples below, we call this exec file as an ___subprocess___ to keep connecting with the panto while other software is running.

(BTW, I used `tree` command to generate above tree graph. You can do `brew(or sudo apt-get) install tree` to try the same.)




## Examples

...under construction...
