
# Live Sass Compiler

**_Lot of code (almost full code) is changed as I've refactored the source code. So, if anything is broken (Hopefully NOT :D ), feel free to open a issue request on GitHub. I'm happy to resolve the bugs._**

**_[If you like the extension, [please leave a review](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass#review-details), it puts a smile on my face.]_**

**_[If you found any bug or if you have any suggestion, feel free to report or suggest me.]_**


[![VSCode Marketplace Badge](https://vsmarketplacebadge.apphb.com/version/ritwickdey.live-sass.svg)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![Total Install](https://vsmarketplacebadge.apphb.com/installs/ritwickdey.live-sass.svg)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![Avarage Rating Badge](https://vsmarketplacebadge.apphb.com/rating-short/ritwickdey.live-sass.svg)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ritwickdey/vscode-live-sass-compiler/)

A VSCode Extension that help you to compile/transpile your SASS/SCSS files to CSS files at realtime with live browser reload.

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

## Extension Dependency 
This extension has dependency on _[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)_ extension for live browser reload.

## What's new ?

* #### Version 0.3.4 (15.08.2017)
    * **[Fixed [#7](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/7)]** Duplicate Output.  _[Thanks [Tomekk-hnm](https://github.com/tomekk-hnm)]_.

* #### Version 0.3.3 (01.08.2017)
    * [[#5](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/5)] Critical Fix Update for Linux & macOS. (Thanks a lot to [Shea Fitzek](https://github.com/sheafitzek)). 

* #### Version 0.3.2 (01.08.2017)
    * [Hot Fix] CSS & map link was broken.


## Changelog
To check full changelog click here [changelog](CHANGELOG.md).

## LICENSE
This extension is licensed under the [MIT License](LICENSE)

## FAQ (For Beginners)

### How to config the settings in my project?

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