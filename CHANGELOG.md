# Changelog


| Version | Date | Changelog|
| ------- | -------- | ------ |
|0.3.4|15.08.17|**[Fixed [#7](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/7)]** Duplicate Output. _[Thanks [Tomekk-hnm](https://github.com/tomekk-hnm)]_.|
|0.3.3|01.08.17|[[#5](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/5)] Critical Fix Update for Linux & macOS. (Thanks a lot to [Shea Fitzek](https://github.com/sheafitzek)). |
|0.3.2 | 01.08.17 | [Hot Fix] CSS & map link was broken. |
|0.3.1 | 30.07.17 | &mdash; Ordering of Output log is fixed.<br><br>NOTE : Lot of code (almost full code) is changed as I've refactored the source code. So, if anything is broken (Hopefully NOT :D ), feel free to open a issue request on GitHub. I'm happy to resolve the bugs. |
|0.3.0|29.07.17| &mdash; This update does not include any new feature or major fix but a big fix in source code setup. I was facing a big configuration issue between TypeScript and non-NPM third-party library since I released the extension - even I was not able to debug extension directly from TypeScript codes. Finally I am able to fix it. (I promise, more updates are coming soon...).<br> &mdash; Statusbar text (at watching mode) has been changed.<br>&mdash;Package size reduced to more than 50%.|
|0.2.2|25.07.17|New Command added for one time Sass/Scss compilation. - Press `F1` or `ctrl+shift+p` and enter `Compile Sass - Without Watch Mode`.|
| 0.2.1 | 21.07.17 |[[#4](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/4)] Critical Bug Fixed update. [Thanks _[Cassio Cabral](https://github.com/cassioscabral)_].|
|0.2.0|20.07.17|[[#3](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/3)] New settings added to exclude specific folders from workspace. All Sass/Scss files inside the folders will be ignored. [Thanks _[Cassio Cabral](https://github.com/cassioscabral) for the suggestion_]. |
|0.1.2|19.07.17| Small Fix (Rename) update.|
| 0.1.1 | 14.07.17 | Fixed [#2](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/2) - Partial Sass/Sass files are not compiling in watching mode. (Thanks again, _[Kerry Smyth](https://github.com/Kerrys7777) :p_) |
|0.1.0| 13.07.17| Feature Added [#1](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/1) - Now the extesion will also generate `Linker Address Map (.map)` files in the same directory of `.css` (Thanks, _[Kerry Smyth](https://github.com/Kerrys7777)_). |
|0.0.5| 11.07.17 |`liveSassCompile.settings.extensionName` settings added. |
|0.0.4 | 11.07.17 | Icon updated.|
|0.0.3 | 11.07.17 | Fix update for Linux environment.|
|0.0.2 | 11.07.17 | Small description updated.|
| 0.0.1 | 11.07.17 | Initial Preview Release with following key features. <br> &mdash; Live SASS & SCSS Compile. <br> &mdash; Customizable file location of exported CSS. <br> &mdash; Customizable exported CSS Style (`expanded`, `compact`, `compressed`, `nested`.)<br> &mdash; Quick Status bar control.<br> &mdash; Live Reload to browser (`Live Server` extension dependency). |


<br>

>#### [Released] (11.07.2017)

>#### [Unreleased] (09.07.17 - 10.07.2017)