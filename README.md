# Live Sass Compiler
[![VSCode Marketplace Badge](https://img.shields.io/vscode-marketplace/v/glenn2223.live-sass.svg?label=VSCode%20Marketplace&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) [![Total Install](https://img.shields.io/vscode-marketplace/d/glenn2223.live-sass.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) [![Average Rating Badge](https://img.shields.io/vscode-marketplace/r/glenn2223.live-sass.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/glenn2223/vscode-live-sass-compiler/)

**_Like it? [Please leave a review](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass#review-details). Found something wrong? [Report an issue](https://github.com/glenn2223/vscode-live-sass-compiler/issues/new)._**

A VSCode Extension that help you to compile/transpile your SASS/SCSS files to CSS files at real-time with live browser reload.

![App Preview](./images/Screenshot/AnimatedPreview.gif)

## Usage/Shortcuts
1. Click to `Watch Sass` from the status bar to turn on the live compilation and then click to `Stop Watching Sass` from the status bar to turn off live compilation . 
![Status bar control](./images/Screenshot/statusbar.jpg)

2. Press `F1` or `ctrl+shift+P` and type `Live Sass: Watch Sass` to start live compilation or, type `Live Sass: Stop Watching Sass` to stop a live compilation.
3. Press `F1` or `ctrl+shift+P` and type `Live Sass: Compile Sass - Without Watch Mode ` to compile SASS or SCSS for one time.

## Features
* Live SASS & SCSS Compile.
* Customizable file location of exported CSS.
* Customizable exported CSS Style (`expanded`, `compressed`).
* Customizable extension name (`.css` or `.min.css`).
* Quick Status bar control.
* Exclude Specific Folders by settings. 
* Live Reload to browser (Dependency on `Live Server` extension).
* Autoprefix Supported (See settings section)

## Installation
Open VSCode Editor and Press `ctrl+P`, type `ext install glenn2223.live-sass`.

## Settings
All settings are now listed in the [Settings Docs](./docs/settings.md).

## FAQ
*All FAQs are now listed in the [FAQ Docs](./docs/faqs.md)*

## Extension Dependency 
This extension has dependency on _[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)_ extension for live browser reload.

## What's new ?

**Breaking changes in v4:**
- Output options are now only `expanded` and `compressed`
- Only works on VS Code v1.50 and over

### 4.2.0 - 2020-12-22

### Added
- New debugging items
    * Two settings: 
        * `liveSass.command.debugInclusion` to check that a current file will be included based on your settings
        * `liveSass.command.debugFileList` for a more indepth look under the hood of the files included and excluded. Which can assist when logging issues
    * New item in the [FAQ](https://github.com/glenn2223/vscode-live-sass-compiler/blob/master/docs/faqs.md) for extra help with glob patterns and reporting files not being compiled

### Changed
- Update the returned message from Autoprefixer warnings. They now better reflect that it's a warning not an error and include file information
- Updated some dependancies:
    * autoprefixer: v10.1.0
    * glob: 7.1.6
    * postcss: 8.2.1
- Also updated some dev dependancies (not effecting the extension itself)

### Other
- Moved to eslinting, prettified the Typescript files

## Changelog
See the full changelog [here](CHANGELOG.md).

## LICENSE
This extension is licensed under the [MIT License](LICENSE)

## Thank you Ritwick Dey
A big thank you to [@ritwickdey](https://github.com/ritwickdey) for all his work. However, as they are no longer maintaining the [original work](https://github.com/ritwickdey/vscode-live-sass-compiler), I have released my own which has built upon it.