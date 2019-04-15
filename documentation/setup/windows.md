# Dependencies (Windows)

## 1. Install `node` & `npm`

[Node.JS](https://nodejs.org/) is a Javascript framework. You can do many interesting things with `node` from web-apps to robotics.
`npm` is `node`'s package manager. Using `npm` you can manage many libraries in your project. If you install `node`, `npm` will also be installed on your machine.

- Download the installer of the [LTS version](https://nodejs.org/)
- Run the installer (no settings need to be changed)
- To test if the installation was successful open the command line and execute `node -v` and `npm -v`. You should get the respective version numbers.

## 2. Install `git`

`git` is a version control system used to track changes in a codebase. It's _the_ main collaboration tool for coding, since it allows multiple users to work on the same project.

There are multiple options how to use `git`. The most basic is the command line utility, but for beginners (or people too lazy to type) it is recommended to use a graphical user interface. We're recommanding GitKraken, since that's what we're using and thus can help you with, but if you're already got an tool that you're comfortable with, you're welcome to use that as well.

### 2.a Install GitKraken

- You won't need to install the command line version of `git` if you install GitKraken.
- [Download](https://www.gitkraken.com/) and install GitKraken.
- You can sign in to GitKraken with GitHub. Not only does this give you access to the Pro version if you're already signed up to the GitHub education program, but it also makes access to projects hosted there a lot easier.

### 2.b Install command line `git`

- If you need instructions to install `git` as an command line tool, you'll probably better off using a graphic user interface to learn the basics.
- Download the installer [here](https://git-scm.com/downloads)
- Run the installer; we suggest change the following options:
  - Uncheck the "Windows Explorer Integration"
 
## 3. Install `python` 2.7

Python is a programming language you've probably heard of before. In this project, it is mainly used as a scripting tool by a dependency. And yes, we'd pretty much prefer to use `python` 3, but said dependency only works with 2. It should be fine if you have 3 installed alongside, but you'll have to install 2 as well.

- [Download](https://www.python.org/downloads/) the python 2.7 installer. At the point of writing, the newest version is [2.7.16](https://www.python.org/downloads/release/python-2716/)
- Run the installer (no settings need to be changed)

## 4. Install `make`

`make` is a build automation tool which can be run to set up and execute different build scripts. It's most notably used in the Unix world, but it can be used on Windows as well.

- Download the installer [here](http://gnuwin32.sourceforge.net/downlinks/make.php)
- Run the installer (no settings need to be changed)
- Add the `bin` (should be `C:\Program Files (x86)\GnuWin32\bin`) folder to the `Path` variable
  - Search for _path_ in the windows search
  - Select "Edit environment variables for your account" or "Umgebungsvariablen für dieses Konto bearbeiten"
  - Select "Path" and click edit
  - Select add and insert the path

## 5. Install the Visual Studio C++ compiler

- Both 2017 and 2019 should work. We've mainly tested with 2017, but there shoulnd't be a problem if you install the 2019 version.
- If you have a Visual Studio version installed, run the installer again to make sure the right package (see below) is installed. You should be able to run it by searching for `Visual Studio Installer` in the Windows search.
- Currently, it seems not to be possible to get VS Enterprise from the HPI (please tell us if we're wrong), so you'll have to use the [Community Version](https://visualstudio.microsoft.com/de/vs/community/).
- Run the installer
- Select at least the workload "Desktopentwicklung mit C++"

## 6. Install Visual Studio Code with the Platformio plugin

Visual Studio Code is a lightweight text editor and IDE, and unlike the normal VS it's open source and completely free. But the main point why we use it is the Platformio plugin, which is a godly alternative to the abomination that is the default Arduino "IDE".

### 6.1 Install Visual Studio Code

- [Download](https://code.visualstudio.com/) the installer. Hint: There's an x64 version hidden under the arrow to the right of "Download for Windows".
- Install it. We'd recommend checking the option to add VS Code to the explorers context menu (especially for folders) since that's pretty handy, but it's your call.

### 6.2 Install the required extensions

- VS Code should ask you to install some extensions once you open the dualpantoframework folder with VS Code for the first time. You should allow that. If for some reason that does not happen or you accidentally clicked no (and for general info), here's a list of the recommended extensions:
  - C/C++ and C++ Intellisense: These two extensions are essential to writing C++ code in VS Code.
  - PlatformIO IDE: An actually functional Arduino build system. This also provides command line tools for automatically uploading the firmware.
  - ESLint: For the JS code in this repository, we're enforcing a coherent formatting. Before commiting to the dualpantoframework, an check is run to enforce all changes follow the rules. This extension allows checking these rules while writing code to avoid surprises.