
# Live Sass Compiler

**_[If you like the extension, [please leave a review](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass#review-details), it puts a smile on my face.]_**

**_[If you found any bug or if you have any suggestion, feel free to report or suggest me.]_**

[![VSCode Marketplace Badge](https://img.shields.io/vscode-marketplace/v/ritwickdey.live-sass.svg?label=VSCode%20Marketplace&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![Total Install](https://img.shields.io/vscode-marketplace/d/ritwickdey.live-sass.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![Avarage Rating Badge](https://img.shields.io/vscode-marketplace/r/ritwickdey.live-sass.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ritwickdey.live-sass) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/ritwickdey/vscode-live-sass-compiler/)

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
* Autoprefix Supported (See setting section)

## Installation
Open VSCode Editor and Press `ctrl+P`, type `ext install live-sass`.

## Settings
* ~~**`liveSassCompile.settings.format`**~~
    <hr>
* ~~**`liveSassCompile.settings.savePath`**~~
    <hr>
* ~~**`liveSassCompile.settings.extensionName`**~~

    <hr>
* ***[NEW]***   **`liveSassCompile.settings.formats`** :  To setup Format (style), Extension Name & Save location for exported css [Multiple Format Supported].

    * *Format can be _`expanded`_, _`compact`_, _`compressed`_ or _`nested`_. _Default is  `expanded`._*

    * *Extension Name can be `.css` or `.min.css`. Default is `.css`.*
     
    * ***[New]***   Save location is relative from workspace root or your Sass files. 
        * Default value is `null`. (`null` means, it will generate CSS in the location of scss/sass. By The Way, It is `null`, NOT `"null"`).
        
        * "`/`" denotes relative to root.
        
        * "`~`" denotes relative to every sass file. - Complex Scenario. *([Checkout the example](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/26#issue-274641546))*
        
    * *Example :*
        
        ```js
            "liveSassCompile.settings.formats":[
                // This is Default.
                {
                    "format": "expanded",
                    "extensionName": ".css",
                    "savePath": null
                },
                // You can add more
                {
                    "format": "compressed",
                    "extensionName": ".min.css",
                    "savePath": "/dist/css"
                },
                // More Complex
                {
                    "format": "compressed",
                    "extensionName": ".min.css",
                    "savePath": "~/../css/"
                }
            ]
        ```
    <hr>
* **`liveSassCompile.settings.excludeList`:** To Exclude specific folders. All Sass/Scss files inside the folders will be ignored.
    * _default value :_
        ```json
            "liveSassCompile.settings.excludeList": [ 
                "**/node_modules/**",
                ".vscode/**" 
            ]
        ```
    * You can use negative glob pattern.
        
        * _Example : if you want exclude all file except `file1.scss` & `file2.scss` from `path/subpath` directory, you can use the expression -_  
        
        ```json
        "liveSassCompile.settings.excludeList": [
            "path/subpath/*[!(file1|file2)].scss"
        ]
        ```
    <hr>
* **`liveSassCompile.settings.includeItems`:** This setting is useful when you deals with only few of sass files. Only mentioned Sass files will be included. 

    * *NOTE: No need to include partial sass files.*
    * *Default value is `null`*
    * Example :
    ```json
        "liveSassCompile.settings.includeItems": [
            "path/subpath/a.scss",
            "path/subpath/b.scss",
        ]
    ``` 
    <hr>
* **`liveSassCompile.settings.generateMap`:** Set it as `false` if you don't want `.map` file for compiled CSS. 
    * _Default is `true`._
    
    <hr>
* **`liveSassCompile.settings.autoprefix` :**
    Automatically add vendor prefixes to unsupported CSS properties (e. g. `transform` -> `-ms-transform`). 
    
    * _Specify what browsers to target with an array of strings (uses [Browserslist](https://github.com/ai/browserslist))._ 
    * _Set `null` to turn off. (Default is `null`)_

    * Example: 
     ```json
       "liveSassCompile.settings.autoprefix": [
            "> 1%",
            "last 2 versions"
        ]
     ``` 
     <hr>
* **`liveSassCompile.settings.showOutputWindow` :** Set this to `false` if you do not want the output window to show.    
    * *NOTE: You can use the command palette to open the Live Sass output window.*
    * *Default value is `true`*

     <hr>

## Extension Dependency 
This extension has dependency on _[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)_ extension for live browser reload.

## What's new ?

* #### Version 1.2.0 (21.12.2017)

    * ***[New Features [#26](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/26)]*** `savePath` setting updated. You can now specify `savePath` location relative to your Sass files. *See Settings section for more details* *[Thanks [Marius](https://github.com/morsanu)]*

    * ***[Bug Fixed [#25](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/25)]*** No more extra new line in generated CSS. *[Thanks [Shahril Amri](https://github.com/redemption024)]*
    
    * ***[Bug Fixed [#33](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/33)]*** Now firefox is recognizing source scss file. *[Thanks [Felix](https://github.com/felix007)]*
    
    * ***[Bug Fixed]*** Regex pattern fixed for `savePath`.

* #### Version 1.1.0 (01.11.2017)
    * ***[NEW [#19](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/19)]*** Support for autoprefix in generated CSS. (see settings section for more) _[Thanks a lot to [boyum](https://github.com/boyum) for sumitting the PR [#22](https://github.com/ritwickdey/vscode-live-sass-compiler/pull/22)]_
    
    * ***[Bug fixed [#20](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/20)]*** : Fixed `liveSassCompile.settings.includeItems` settings. *[Thanks [Hoàng Nam](https://github.com/hoangnamitc)]*



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
     "liveSassCompile.settings.formats":[
        {
            "format": "expanded",
            "extensionName": ".css",
            "savePath": "/css"
        },
        {
            "extensionName": ".min.css",
            "format": "compressed",
            "savePath": "/dist/css"
        }
    ],
    "liveSassCompile.settings.excludeList": [
       "**/node_modules/**",
       ".vscode/**"
    ],
    "liveSassCompile.settings.generateMap": true,
    "liveSassCompile.settings.autoprefix": [
        "> 1%",
        "last 2 versions"
    ]
}
```