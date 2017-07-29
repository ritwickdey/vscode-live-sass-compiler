
# Live Sass Compiler

**_[If you found any bug or if you have any suggestion, feel free to report or suggest me. If you like the extension, don't forgot to rate it.]_**

**_[[I need your guide/help]](https://github.com/ritwickdey/vscode-live-sass-compiler/blob/master/README.md#help-)_**

[![VSCode Marketplace Badge](https://vsmarketplacebadge.apphb.com/version/ritwickdey.live-sass.svg)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![Total Install](https://vsmarketplacebadge.apphb.com/installs/ritwickdey.live-sass.svg)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![Avarage Rating Badge](https://vsmarketplacebadge.apphb.com/rating-short/ritwickdey.live-sass.svg)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ritwickdey/vscode-live-sass-compiler/)

A Visual Studio Code Extension that help you to compile/transpile your SASS/SCSS files to CSS files at realtime with live browser reload.

![App Preview](./images/Screenshot/AnimatedPreview.gif)

## Usage/Shortcuts
1. Click to `Watch Sass` from Statusbar to turn on the live compilation and then click to `Stop Watching Sass` from Statusbar to turn on live compilation . 
![Statusbar control](./images/Screenshot/statusbar.jpg)

2. Press `F1` or `ctrl+shift+P` and type `Live Sass: Watch Sass` to start live compilation or, type `Live Sass: Stop Watching Sass` to stop a live compilation.
3. Press `F1` or `ctrl+shift+P` and type `Live Sass: Compile Sass - Without Watch Mode ` to compile Sass or Scss for one time.

## Features
* Live SASS & SCSS Compile.
* Customizable file location of exported CSS.
* Customizable exported CSS Style (`expanded`, `compact`, `compressed`, `nested`).
* Customizable extension name (`.css` or `.min.css`).
* Quick Status bar control.
* Exclude Specific Folders by settings. 
* Live Reload to browser (Dependency on `Live Server` extension).

## Installation
Open VSCode Editor and Press `ctrl+P`, type `ext install live-sass`.

## Settings
* **`liveSassCompile.settings.format` :** To customize exported CSS style - _`expanded`_, _`compact`_, _`compressed`_ or _`nested`_.
    * _Default is  `expanded`._

* **`liveSassCompile.settings.savePath` :** To customizable file location of exported CSS. Set absulate path from workspace Root.`'/'` stands for your workspace root.
    * _Example: `/subfolder1/subfolder2`. All generated CSS file will be saved at `subfolder2`._
    * _NOTE: If destination folder does not exist, folder will be created as well._ 
    * _Default value is `null`, CSS will be generated at same directory of every SASS/SCSS files._
* **`liveSassCompile.settings.extensionName` :** To customize extension name (`.css` or `.min.css`) of generated CSS. 
    * _Default is `.css`._
* **`liveSassCompile.settings.excludeFolders` :** To Exclude specific folders. All Sass/Scss files inside the folders will be ignored.
    * _default value :_
        ```json
            [ 
                "**/node_modules/**",
                ".vscode/**" 
            ]
        ```

## How to config the settings in my project? (FAQ):
Create a `.vscode` folder in the root of project. Inside of `.vscode` folder create a json file named `settings.json`.
Inside of the `settings.json`, type following key-value pairs. By the way you'll get intelli-sense.

```json
{
    "liveSassCompile.settings.savePath": "/dist/css",
    "liveSassCompile.settings.format": "compressed",
    "liveSassCompile.settings.extensionName" : ".min.css",
    "liveSassCompile.settings.excludeFolders": [
       "**/node_modules/**",
       ".vscode/**"
    ]
}
```

## Extension Dependency 
This extension has dependency on _[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)_ extension for live browser reload.

## What's new ?

* #### Version 0.2.2 (19.07.2017)
    * New Command added for one time Sass/Scss compilation - Press `F1` or `ctrl+shift+p` and enter `Compile Sass - Without Watch Mode`.

* #### Version 0.2.1 (21.07.2017)
    * [[#4](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/4)] Critical Bug Fixed update. [Thanks _[Cassio Cabral](https://github.com/cassioscabral)_].

* #### Version 0.2.0 (20.07.2017)
 
    * [[#3](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/3)] New settings added to exclude specific folders from workspace. All Sass/Scss files inside the folders will be ignored. [Thanks _[Cassio Cabral](https://github.com/cassioscabral) for the suggestion_] .



## Changelog
To check full changelog click here [changelog](CHANGELOG.md).

## LICENSE
This extension is licensed under the [MIT License](LICENSE)

<br>
<br>

> ## HELP : 
> I am using Sass.js library to compile SASS to CSS. This libary is not avaliable through NPM. So, I manually put the JS files in project folder. Now, TypeScript tries to generate `.map` file of the library (library size 3MB) and I get compile time error (`Memory out of heap` - like that). So, I set `"sourceMap": false,` . Now I'm not getting the error. But problem is that while debugging. I have to go `out` folder to debug. Another problem is that on every single save TypeScript always copy the library to `out` directory while cause slow performce of VScode while debugging.