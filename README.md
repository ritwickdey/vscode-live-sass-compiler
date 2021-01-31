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
* Live SASS & SCSS compile.
* Customizable file location of exported CSS.
* Customizable exported CSS style (`expanded`, `compressed`).
* Customizable extension name (`.css` or `.min.css`).
* Quick status bar control.
* Exclude specific folders by settings. 
* Live reload to browser (Dependency on `Live Server` extension).
* Autoprefix support (See settings section)

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
- Only works on VS Code v1.50 and newer

### 4.4.0 - 2021-01-31

### Added
- New setting: `liveSassCompile.settings.forceBaseDirectory` #25
  - A new setting that can help performance in large projects with few Sass/Scss files.
  - **Note:** multi-root workspace with different folder structures can not use this efficiently (See [setting note](https://github.com/glenn2223/vscode-live-sass-compiler/blob/1d043a0541008dfa2b53c492f6a76dce4e3d9909/docs/settings.md) & [VS Code Feature Request](https://github.com/microsoft/vscode/issues/115482) (:+1: it) )
- New feature: The status bar `Error` and `Success` messages can be clicked which will open the Output Window #25

### Updates
- `autoprefixer` from `10.2.1` to `10.2.4`
  - Small bug fixes (nothing user facing)
- Various dev-dependancy updates

### Fixed
- Part fix: Slwo file handling #22. Full fix in v5 as some small breaking changes
  - The glob pattern matcher is causing bottlenecks, reducing load calls with small patch. However moving away from glob is the end-game (which will be happening in v5)
- Fix: `compileCurrentSass` shows wrong message on fail
  - When you run `compileCurrentSass` and it would fail (for whatever reason) it would cause the output to show `Success` rather than `Error` (just the output was wrong, nothing else)
- Fix: Status bar inconsistancies during display changes
  - When command bar is changing between visuals it was possible to cause the status and the shown message to be out of sync (due to clicks while setTimeouts are pending), the setup also meant you couldn't sync them again (unless you did a manual compile command)

*See the full changelog [here](CHANGELOG.md).*

## LICENSE
This extension is licensed under the [MIT License](LICENSE)

## Thank you Ritwick Dey
A big thank you to [@ritwickdey](https://github.com/ritwickdey) for all his work. However, as they are no longer maintaining the [original work](https://github.com/ritwickdey/vscode-live-sass-compiler), I have released my own which has built upon it.
