# Live Sass Compiler

**_[If you like the extension, [please leave a review](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass#review-details), it puts a smile on my face.]_**

**_[If you found any bug or if you have any suggestion, feel free to report or suggest me.]_**

[![VSCode Marketplace Badge](https://img.shields.io/vscode-marketplace/v/glenn2223.live-sass.svg?label=VSCode%20Marketplace&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) [![Total Install](https://img.shields.io/vscode-marketplace/d/glenn2223.live-sass.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) [![Average Rating Badge](https://img.shields.io/vscode-marketplace/r/glenn2223.live-sass.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/glenn2223/vscode-live-sass-compiler/)

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
* Autoprefix Supported (See setting section)

## Installation
Open VSCode Editor and Press `ctrl+P`, type `ext install live-sass`.

## Settings
All settings are now listed here  [Settings Docs](./docs/settings.md).

## FAQ
*All FAQs are now listed here [FAQ Docs](./docs/faqs.md)*

## Extension Dependency 
This extension has dependency on _[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)_ extension for live browser reload.

## What's new ?

### 4.0.0 - 2020-12-20
### Breaking changes
- Output options are now only `expanded` and `compressed`
- Only works on VS Code v1.50 and over

#### Fixed
- Changed from `libsass` to `sass` (more up to date release)
    * Fixes: many issues + performance improvement
- Map line numbers are correct after `autoprefixer` is applied
    * Fixes: [#279](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/279), [#242](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/242), [#70](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/70)

#### Added
- Replace segments in the save path: added two new settings under `liveSassCompile.settings.formats`
    * `savePathSegmentKeys` - A list of segments to be replaced
    * `savePathReplaceSegmentsWith` - The replacement value
- New setting `liveSassCompile.settings.watchOnLaunch`
    * When `true` it will automatically start watching your `.sass` or `.scss` files on launch. *Default value is `false`*
- New logging mechanism
    * Errors are logged in a workspace folder
    * New command to help log issues for unhandled errors `liveSass.command.createIssue`

## Changelog
See the full changelog [here](CHANGELOG.md).

## LICENSE
This extension is licensed under the [MIT License](LICENSE)

## Thank you Ritwick Dey
A big thank you to [@ritwickdey](https://github.com/ritwickdey) for all his work. However, as they are no longer maintaining the [original work](https://github.com/ritwickdey/vscode-live-sass-compiler), I have released my own which has built upon his original work.