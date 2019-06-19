# Dependencies (MacOS)

## 1. Learn how to use your terminal

- Search spotlight for `terminal` or go to the Utility folder in your Application folder.

<!-- ## 2. Install brew

- Run this command in your terminal: `/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
- Once installation finished, type `brew doctor` to check if it's working (it may give you some warning but that's fine for now) -->

## 2. Install `node` & `npm`

[Node.JS](https://nodejs.org/) is a Javascript framework. You can do many interesting things with `node` from web-apps to robotics.
`npm` is `node`'s package manager. Using `npm` you can manage many libraries in your project. If you install `node`, `npm` will also be installed on your machine.

- Download the installer of the [LTS version](https://nodejs.org/)
- Run the installer (no settings need to be changed)
- To test if the installation was successful open the command line and execute `node -v` and `npm -v`. You should get the respective version numbers.

## 3. Install `git`

`git` is a version control system used to track changes in a codebase. It's _the_ main collaboration tool for coding, since it allows multiple users to work on the same project.

There are multiple options how to use `git`. The most basic is the command line utility, but for beginners (or people too lazy to type) it is recommended to use a graphical user interface. We're recommanding GitKraken, since that's what we're using and thus can help you with, but if you're already got an tool that you're comfortable with, you're welcome to use that as well.

### 3.a Install GitKraken

- You won't need to install the command line version of `git` if you install GitKraken.
- [Download](https://www.gitkraken.com/) and install GitKraken.
- You can sign in to GitKraken with GitHub. Not only does this give you access to the Pro version if you're already signed up to the GitHub education program, but it also makes access to projects hosted there a lot easier.

### 3.b Install command line `git`

- If you need instructions to install `git` as an command line tool, you'll probably better off using a graphic user interface to learn the basics.
- Download the installer [here](https://git-scm.com/downloads)
- Run the installer

## 4. Install `python` 2.7

Python is a programming language you've probably heard of before. In this project, it is mainly used as a scripting tool by a dependency. And yes, we'd pretty much prefer to use `python` 3, but said dependency only works with 2. It should be fine if you have 3 installed alongside, but you'll have to install 2 as well.

- [Download](https://www.python.org/downloads/) the python 2.7 installer. At the point of writing, the newest version is [2.7.16](https://www.python.org/downloads/release/python-2716/)
- Run the installer

## 5. Install XCode

- Use the App Store to install XCode.
- Run `xcode-select --install` to install the compilers.

Also check that `xcodebuild` is set as a command. 
- Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.

## 6. Install Visual Studio Code with the Platformio plugin

Visual Studio Code is a lightweight text editor and IDE, and unlike the normal VS it's open source and completely free. But the main point why we use it is the Platformio plugin, which is a godly alternative to the abomination that is the default Arduino "IDE".

### 6.1 Install Visual Studio Code

- [Download](https://code.visualstudio.com/) the installer.
- Install it.

### 6.2 Install the required extensions

- VS Code should ask you to install some extensions once you open the dualpantoframework folder with VS Code for the first time. You should allow that. If for some reason that does not happen or you accidentally clicked no (and for general info), here's a list of the recommended extensions:
  - C/C++ and C++ Intellisense: These two extensions are essential to writing C++ code in VS Code.
  - PlatformIO IDE: An actually functional Arduino build system. This also provides command line tools for automatically uploading the firmware.
  - ESLint: For the JS code in this repository, we're enforcing a coherent formatting. Before commiting to the dualpantoframework, an check is run to enforce all changes follow the rules. This extension allows checking these rules while writing code to avoid surprises.