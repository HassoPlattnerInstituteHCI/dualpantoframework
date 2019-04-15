# Dependencies (Linux)

## 1. Learn how to use your terminal

- This is dependent on your distribution.
- You probably can find your terminal somewhere in the menu bar of your OS.

## 2. Install Snapcraft

Canonocal's Snapcraft is a cross-distribution way to install software. If you know your distro and its package manager well, you're probably able to install all dependencies on your own, but for everyone else it's easier to just use Snapcraft.

It is already installed on Ubuntu 16.04, 18.04 and 18.10 (and most distros based on these). You can check by running `snap --version`.

Otherwise, follow the instructions for your distro [here](https://docs.snapcraft.io/installing-snapd/6735).

## 2. Install `node` and `npm`

[Node.JS](https://nodejs.org/) is a Javascript framework. You can do many interesting things with `node` from web-apps to robotics.
`npm` is `node`'s package manager. Using `npm` you can manage many libraries in your project. If you install `node`, `npm` will also be installed on your machine.

- Install `node` and `npm` by running `sudo snap install node --channel=10/stable --classic`.

## 4. Install `git`

`git` is a version control system used to track changes in a codebase. It's _the_ main collaboration tool for coding, since it allows multiple users to work on the same project.

There are multiple options how to use `git`. The most basic is the command line utility, but for beginners (or people too lazy to type) it is recommended to use a graphical user interface. We're recommanding GitKraken, since that's what we're using and thus can help you with, but if you're already got an tool that you're comfortable with, you're welcome to use that as well.

- Install GitKraken by running `sudo snap install gitkraken`.

If you want to use the command line `git` instead, install it using your distro's package manager.

## 5. Install `python` 2.7

`python` is a programming language you've probably heard of before. In this project, it is mainly used as a scripting tool by a dependency. And yes, we'd pretty much prefer to use `python` 3, but said dependency only works with 2. It should be fine if you have 3 installed alongside, but you'll have to install 2 as well.

`python` may come pre-installed with your distro (e.g. Ubuntu, Debian). To check, run `python --version`. If it is any version of 2.7, you're good to go.

If it is either not found or any version of `python` 3, please check how to get `python` 2 on your distro.

## 6. Make sure you got C++ build tools

Check `make --version` and `g++ --version`. If both output something sensible and the `g++` version is 5 or greater, you're good to go.

Otherwise, please check how to install these on your distro. E.g. for Ubuntu, this should be `sudo apt install build-essentials`.

## 7. Install Visual Studio Code with the Platformio plugin

Visual Studio Code is a lightweight text editor and IDE, and unlike the normal VS it's open source and completely free. But the main point why we use it is the Platformio plugin, which is a godly alternative to the abomination that is the default Arduino "IDE".

### 7.1 Install Visual Studio Code

- Run `sudo snap install code --classic`

### 7.2 Install the required extensions

- VS Code should ask you to install some extensions once you open the dualpantoframework folder with VS Code for the first time. You should allow that. If for some reason that does not happen or you accidentally clicked no (and for general info), here's a list of the recommended extensions:
  - C/C++ and C++ Intellisense: These two extensions are essential to writing C++ code in VS Code.
  - PlatformIO IDE: An actually functional Arduino build system. This also provides command line tools for automatically uploading the firmware.
  - ESLint: For the JS code in this repository, we're enforcing a coherent formatting. Before commiting to the dualpantoframework, an check is run to enforce all changes follow the rules. This extension allows checking these rules while writing code to avoid surprises.
