# Live Sass Compiler

**_[NOTE: I am able to compile full `Bootstrap 4` scss files with extension. If you found any bug or if you have any suggetion, feel free to report or suggest me. If you like the extension, don't forgot to rate it.]_**

A Visual Studio Code Extension that help you to compile/transpile your SASS/SCSS files to CSS files at realtime with live browser reload.

![App Preview](./images/Screenshot/AnimatedPreview.gif)

## Usage/Shortcuts
1. Click to `Watch my Sass` from Statusbar to turn on the live compilation and then click to `Stop Watching Sass` from Statusbar to turn on live compilation . 
![Statusbar control](./images/Screenshot/statusbar.jpg)

2. Press `F1` or `ctrl+shift+P` and type `Live Sass: Watch Sass` to start live compilation or, type `Live Sass: Stop Watching Sass` to stop a live compilation.

## Features
* Live SASS & SCSS Compile.
* Customizable file location of exported CSS.
* Customizable exported CSS Style (`expanded`, `compact`, `compressed`, `nested`).
* Customizable extension name (`.css` or `.min.css`).
* Quick Status bar control.
* Live Reload to browser (Dependency on `Live Server` extension).

## Installation
Open VSCode Editor and Press `ctrl+P`, type `ext install live-sass`.

## Settings
* `liveSassCompile.settings.format` : To customize exported CSS style - _`expanded`_, _`compact`_, _`compressed`_ or _`nested`_.
    * _Default is  `expanded`._

* `liveSassCompile.settings.savePath` : To customizable file location of exported CSS. Set absulate path from workspace Root.`'/'` stands for your workspace root.
    * _Example: `/subfolder1/subfolder2`. All generated CSS file will be saved at `subfolder2`._
    * _NOTE: If destination folder does not exist, folder will be created as well._ 
    * _Default value is `null`, CSS will be generated at same directory of every SASS/SCSS files._
* `liveSassCompile.settings.extensionName` : To customize extension name (`.css` or `.min.css`) of generated CSS. 
    * _Default is `.css`._

## How to config the settings in my project? (FAQ):
Create a `.vscode` folder in the root of project. Inside of `.vscode` folder create a json file named `settings.json`.
Inside of the `settings.json`, type following key-value pairs. By the way you'll get intelli-sense.

```json
{
    "liveSassCompile.settings.savePath": "/dist/css",
    "liveSassCompile.settings.format": "compressed",
    "liveSassCompile.settings.extensionName" : ".min.css"
}
```

## Extension Dependency 
This extension has dependency on _[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)_ extension for live browser reload.

## What's new ?

### Version 0.0.5 (12.07.2017)
* `liveSassCompile.settings.extensionName` settings added.

### Version 0.0.4 (11.07.2017)
* Icon updated

### Version 0.0.3 (11.07.2017)
* Fix update for Linux environment.


## Changelog
To check full changelog click here [changelog](CHANGELOG.md).

## LICENSE
This extension is licensed under the [MIT License](LICENSE)