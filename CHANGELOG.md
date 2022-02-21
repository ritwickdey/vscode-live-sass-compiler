<!-- 
Guiding Principles
- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each version is displayed.
- Mention whether you follow Semantic Versioning.

Types of changes
- Added for new features.
- Changed for changes in existing functionality.
- Deprecated for soon-to-be removed features.
- Removed for now removed features.
- Fixed for any bug fixes.
- Security in case of vulnerabilities.
- Breaking changes for break in new revision
- Other for notable changes that do not 
 -->

# Changelog
All notable changes to this project will be documented in this file.

## [5.2.0] - 2022-02-21

### Added
- `@warn` and `@debug` lines, as well as other SASS warnings, are now shown in the output window - Closes [#89](https://github.com/glenn2223/vscode-live-sass-compiler/issues/89)
- You can now specify the files/folders to treat as partials using the new `liveSassCompile.settings.partialsList` setting - Closes [#143](https://github.com/glenn2223/vscode-live-sass-compiler/issues/143)

### Changes
- Updated docs to reflect new setting and also included previous changes in the FAQ
- Further logging in a function at `Trace` level

### Fixed
- Stopped returning false negatives when checking if a file should trigger compilation thanks to a bump to `fdir` - Closes [#145](https://github.com/glenn2223/vscode-live-sass-compiler/issues/145)
- Use actual saved file rather that finding active file (helps with Live Share compatibility) - Partial fix for [#151](https://github.com/glenn2223/vscode-live-sass-compiler/issues/151)
- Workspace loop numbering outputs the correct figure
- Update broken reference link in settings documentation - thanks @dawidmachon
- Source maps would add duplicates, mostly with incorrect paths - Fixes [#135](https://github.com/glenn2223/vscode-live-sass-compiler/issues/135)
- Extension checks are no longer case sensitive (i.e. `.Sass` will now match) - Fixes [#137](https://github.com/glenn2223/vscode-live-sass-compiler/issues/137)
- Valid save paths in the `liveSassCompile.settings.formats` setting no longer throws a warning - Fixes [#139](https://github.com/glenn2223/vscode-live-sass-compiler/issues/139)
- No longer outputs error if the css generated is an empty string - Fixes [#140](https://github.com/glenn2223/vscode-live-sass-compiler/issues/140)

### Updated
- `autoprefixer` from `10.3.7` to `10.4.2`
  - Added `:autofill` support
  - Fixed `::file-selector-button` data
  - Fixed missed `-webkit-` prefix for `width: stretch`
- `fdir` from `5.1.0` to `5.2.0`
  - Fixed a critical issue with async crawling that caused the crawler to return early
  - Other changes *(nothing user facing)*
- `picomatch` from `2.3.0` to `2.3.1`
  - Fixes bug when a pattern containing an expression after the closing parenthesis (`/!(*.d).{ts,tsx}`) was incorrectly converted to regexp
  - Other changes *(nothing user facing)*
- `postcss` from `8.3.9` to `8.4.5`
  - Various changes *(nothing user facing)*
- `sass` from `1.37.5` to `1.49.8`
  - *Potentially breaking bug fix:* Change the default value of the `separator` parameter for `new SassArgumentList()` to `','` rather than `null`. This matches the API specification.
  - *Potentially breaking bug fix:* Properly parse custom properties in `@supports` conditions. Note that this means that SassScript expressions on the right-hand side of custom property `@supports` queries now need to be interpolated, as per https://sass-lang.com/d/css-vars.
  - *Potentially breaking bug fix:* Fix a bug where `inspect()` was not properly printing nested, empty, bracketed lists.
  - In expanded mode, emit characters in Unicode private-use areas as escape sequences rather than literal characters.
  - Fix a bug where quotes would be omitted for an attribute selector whose value was a single backslash.
  - Properly consider numbers that begin with `.` as "plain CSS" for the purposes of parsing plain-CSS `min()` and `max()` functions.
  - Allow `if` to be used as an unquoted string.
  - Properly parse backslash escapes within `url()` expressions.
  - Fix a couple bugs where `@extend`s could be marked as unsatisfied when multiple identical `@extend`s extended selectors across `@use` rules.
  - Add a `charset` option that controls whether or not Sass emits a `@charset`/BOM for non-ASCII stylesheets.
  - `min()` and `max()` expressions are once again parsed as calculations as long as they contain only syntax that's allowed in calculation expressions. To avoid the backwards-compatibility issues that were present in 1.40.0, they now allow unitless numbers to be mixed with numbers with units just like the global `min()` and `max()` functions. Similarly, `+` and `-` operations within `min()` and `max()` functions allow unitless numbers to be mixed with numbers with units.
  - Fix a bug where Sass variables and function calls in calculations weren't being resolved correctly if there was a parenthesized interpolation elsewhere in the file.
  - Add support for the `logger` option. This takes an object that can define `warn` or `debug` methods to add custom handling for messages emitted by the Sass compiler. See the JS API docs for details.
      **Please note:** this will now print warnings for any divisions using `/`, please use the new `math.div(100, 20)` function or `calc(100 / 20)`
  - Improve the error message when the default namespace of a `@use` rule is not a valid identifier.
  - Improve performance
  - Fix a bug where calculations with different operators were incorrectly considered equal.
  - Properly parse attribute selectors with empty namespaces.
  - Various changes *(nothing user facing)*
- Various dev dependency updates *(nothing user facing)*

## [5.1.1] - 2021-10-11

### Fixed
- Implemented strict checks to reduce chances of unhandled errors - Closes [#128](https://github.com/glenn2223/vscode-live-sass-compiler/issues/128)

### Updated
- `postcss` from `8.3.6` to `8.3.9`
  - Replaced `colorette` with `picocolors`
  - Other changes  *(nothing user facing)*
- `autoprefixer` from `10.3.1` to `10.3.7`
  - Fixed `::file-selector-button` support
  - Fixed `stretch` value in latest Firefox
  - Reduced package size
  - Replaced `colorette` with `picocolors`
  - Other changes  *(nothing user facing)*
- Various dev dependency updates *(nothing user facing)*

## [5.1.0] - 2021-08-06

### Fixed
- The UI description for `showOutputWindowOn` was stating the default is `Warning` when, in fact, it is `Information`
- File searching is no longer case sensitive - it is still accent sensitive
- Stopped outputting `Watching...` twice when compilation happens on watching
- A single file - that is a window without a workspace - would error and not compile
- `Change detected - {DateTime}` is now output when `showOutputOn` is set to `"Information"`. This better reflects the functionality of the original extension

### Added
- New settings to support all other SASS output formatting options - Closes [#82](https://github.com/glenn2223/vscode-live-sass-compiler/issues/82)  
The new settings are:
  - `liveSassCompile.settings.formats.linefeed` - control the line terminator used
  - `liveSassCompile.settings.formats.indentType` - control whether indents are spaces or tabs
  - `liveSassCompile.settings.formats.indentWidth` - control the width of the indentation
- New commands to change the `showOutputOn` from the command pallete - Closes [#63](https://github.com/glenn2223/vscode-live-sass-compiler/issues/63)  
Having these commands in the pallete also means that key combos can be set for each  
The new commands are:
  - `liveSass.command.showOutputOn.trace`
  - `liveSass.command.showOutputOn.debug`
  - `liveSass.command.showOutputOn.information`
  - `liveSass.command.showOutputOn.warning`
  - `liveSass.command.showOutputOn.error`
  - `liveSass.command.showOutputOn.none`

### Changes
- Added more and adjusted some logging messages *(primarily to `Trace` levels)*
- A lot of documentation tweaks
- Some linting tweaks *(nothing user facing)*

### Updated
- `sass` from `1.32.12` to `1.37.5`
  - **Potentially breaking bug fix:** Properly throw an error for Unicode ranges that have too many `?`s after hexadecimal digits, such as `U+12345??`
  - **Potentially breaking bug fix:** Fixed a bug where certain local variable declarations nested within multiple `@if` statements would incorrectly override a global variable. It's unlikely that any real stylesheets were relying on this bug, but if so they can simply add `!global` to the variable declaration to preserve the old behaviour
  - Fix an edge case where `@extend` wouldn't affect a selector within a pseudo-selector such as `:is()` that itself extended other selectors
  - Fix a couple bugs that could prevent some members from being found in certain files that use a mix of imports and the module system.
  - Fix incorrect recommendation for migrating division expressions that reference namespace variables.
  - **Potentially breaking bug fix:** Null values in `@use` and `@forward` configurations no longer override the `!default` variable, matching the behaviour of the equivalent code using `@import`.
  - Use the proper parameter names in error messages about `string.slice`
  - Deprecate the use of `/` for division. The new `math.div()` function should be used instead. See [this page](https://sass-lang.com/documentation/breaking-changes/slash-div) for details.
  - Add a `list.slash()` function that returns a slash-separated list.
  - **Potentially breaking bug fix:** The heuristics around when potentially slash-separated numbers are converted to slash-free numbers—for example, when `1/2` will be printed as `0.5` rather than `1/2`—have been slightly expanded. Previously, a number would be made slash-free if it was passed as an argument to a user-defined function, but not to a built-in function. Now it will be made slash-free in both cases. This is a behavioural change, but it's unlikely to affect any real-world stylesheets.
  - `:is()` now behaves identically to `:matches()`.
  - Fix a bug where non-integer numbers that were very close to integer values would be incorrectly formatted in CSS.
  - Fix a bug where very small number and very large negative numbers would be incorrectly formatted in CSS.
  - Fix the URL for the `@-moz-document` deprecation message.
  - Fix a bug with `@for` loops nested inside property declarations.`
  - Fix a couple bugs that could prevent some members from being found in certain files that use a mix of imports and the module system.
  - Fix incorrect recommendation for migrating division expressions that reference namespace variables
  - Fix a bug where the quiet dependency flag didn't silence warnings in some stylesheets loaded using `@import`
  - Other changes  *(nothing user facing)*
- `autoprefixer` from `10.2.5` to `10.3.1`
  - Added `::file-selector-button` support
  - Fixed adding wrong prefixes to `content`
  - Fixed “no prefixes needed” warning 
- `postcss` from `8.2.14` to `8.3.6`
  - Fixed column in `missed semicolon` error 
  - Source map performance improvements
  - Fixed broken AST detection
  - Other changes  *(nothing user facing)*
- `fdir` from `5.0.0` to `5.1.0`
  - Performance & memory usage has also been greatly improved due to the many internal refactoring
  - Other changes  *(nothing user facing)*
- `picomatch` from `2.2.3` to `2.3.0`
  - Fixes bug where file names with two dots were not being matched consistently with negation `extglobs` containing a star
- Various dev dependency updates *(nothing user facing)*

## [5.0.4] - 2021-06-22

### Security
- Bumped `glob-parent` to `5.1.2`
  - eliminate ReDoS

## [5.0.3] - 2021-05-05

### Changes
- The default for `liveSassCompile.settings.showOutputWindowOn` is now `Information`
  - To prevent future issues like [#70](https://github.com/glenn2223/vscode-live-sass-compiler/issues/70) & [#76](https://github.com/glenn2223/vscode-live-sass-compiler/issues/76). *Where issues are created because, by default, compiling didn't output the same details that the original extension did*
- Updated the documentation to match the above change - and also sorted a couple of typos
- Removed reference to live reload in `package.json`

### Updated
- `postcss` from `8.2.10` to `8.2.14`
  - Fixed ReDoS vulnerabilities in source map parsing
  - Other small changes *(nothing user facing)*
- `sass` from `1.32.11` to `1.32.12`
  - Fix a bug that disallowed more than one module from extending the same selector from a module if that selector itself extended a selector from another upstream module.
- Various dev dependency updates *(nothing user facing)*

## [5.0.2] - 2021-04-19

### Updated
- `picomatch` from `10.2.4` to `10.2.5`
  - Do not skip pattern separator for square brackets
  - Other small changes *(nothing user facing)*
- `postcss` from `8.2.9` to `8.2.10`
  - Fixed ReDoS vulnerabilities in source map parsing
  - Other small changes *(nothing user facing)*
- `sass` from `1.32.8` to `1.32.11`
  - Small changes *(nothing user facing)*
- Various dev dependency updates *(nothing user facing)*

## [5.0.1] - 2021-04-07

### Fixed
- Bump to stop installation issues caused by original RC uploads ([#54](https://github.com/glenn2223/vscode-live-sass-compiler/issues/54))

### Changes
- No extension changes

## [5.0.0] - 2021-04-06

### Breaking changes
- Not dependant on `ritwickdey.LiveServer` as there was no actual code dependencies in the extension ([#23](https://github.com/glenn2223/vscode-live-sass-compiler/issues/23)). If you require the Live Server extension, it can still be installed from [here](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- Changes to the `showOutputWindow` setting, **now called `showOutputWindowOn`** ([#26](https://github.com/glenn2223/vscode-live-sass-compiler/issues/26))
  - The system now acts as more of a logger rather than a mass of information
  - Accepted values are now `Trace`, `Debug`, `Information`, `Warning`, `Error` or `None`
  - The default is now `Warning`
- Changes to [`autoprefix` settings](https://github.com/glenn2223/vscode-live-sass-compiler/blob/master/docs/settings.md#livesasscompilesettingsautoprefix) ([#41](https://github.com/glenn2223/vscode-live-sass-compiler/issues/41))
  - The default is now `defaults` *(as per Autoprefixer recommendations)*
  - The setting no longer accepts `string[] OR null`, but a `string[] OR boolean`
    - Rather than `null`, you now use `false`
- No longer supporting `brace expansion` glob patterns ([#27](https://github.com/glenn2223/vscode-live-sass-compiler/issues/27))
  - This is because the underlying glob pattern matching has moved from `minimatch` to `picomatch`. A full feature comparison can be found [here](https://github.com/micromatch/picomatch#library-comparisons)
- Only works on VS Code v1.52 and newer ([#34](https://github.com/glenn2223/vscode-live-sass-compiler/issues/34))
- Settings have been updated for continuity and to better aid extension performance ([#30](https://github.com/glenn2223/vscode-live-sass-compiler/issues/30))
  - `formats[].savePath` must start with a path separator but not end in one
  - `includeItems` must start with a path separator and end in either `.sass` or `.scss` (for performance purposes)
  - `forceBaseDirectory` must start with a path separator but not end in one

### Added
- When `autoprefix` is true we will search for either:
  - a `.browserlistsrc` file or,
  - `"browserslist": [ string[] ]` in a `package.json` file

  *(This allows you to use the same setting across your solution, rather than duplicating content)*
- Increased range of glob pattern support
  - Full support for `extglobs`
  - Added support for `posix brackets`
  - Added support for `regex syntax`
  - *Full comparison can be found [here](https://github.com/micromatch/picomatch#library-comparisons)*
- When a change is detected the initial output now includes a date and time stamp - See [this comment](https://github.com/glenn2223/vscode-live-sass-compiler/issues/26#issuecomment-788133683) on [#26](https://github.com/glenn2223/vscode-live-sass-compiler/issues/26)

### Fixed
- Fixed: the `formats[].savePathSegmentKeys` setting would allow non string values in the array
- Fixed: the `excludeList` setting would allow non string values in the array
- Fixed: the `includeItems` setting would allow non string values in the array
- Fixed: the `autoprefix` setting would allow non string values in the array
- Fixed: some setting descriptions have been updated for better clarity/readability
- Error catching no longer fails when the error is with finding SASS files. Instead, this fact is highlighted

### Updated
- `autoprefixer` from `10.2.4` to `10.2.5`
  - Fixed `:` support in `@supports`
- `postcss` from `8.2.4` to `8.2.9`
  - Small fixes *(nothing user facing)*
- `sass` from `1.32.5` to `1.32.8`
  - Allow `@forward...with` to take arguments that have a `!default` flag without a trailing comma.
  - Improve the performance of unitless and single-unit numbers.
  - Other small changes *(nothing user facing)*
- Various dev dependency updates *(nothing user facing)*

### Changed
- Now using `fdir` with `picomatch` instead of `glob` and `minimatch`
  - Speed improvements, the most significant of which will be on larger projects
  - Greater support for glob patterns
- A lot of documentation tweaks

---

## [4.4.1] - 2021-01-31

### Fixed
- Fixed: `forceBaseDirectory` has full support in multi-root workspaces
- Fixed: the path in `forceBaseDirectory` is now checked to see if it exists. If not a user friendly message is displayed in the output
- Fixed: an error when checking files would still compile what it could. This would hide the error message from the user
- Incorrect pattern matches in settings show user friendly messages rather than "does not match pattern"

## [4.4.0] - 2021-01-31

### Added
- New setting: `liveSassCompile.settings.forceBaseDirectory` #25
  - A new setting that can help performance in large projects with few Sass/Scss files.
  - ~~**Note:** multi-root workspace with different folder structures can not use this efficiently (See [setting note](https://github.com/glenn2223/vscode-live-sass-compiler/blob/1d043a0541008dfa2b53c492f6a76dce4e3d9909/docs/settings.md) & [VS Code Feature Request](https://github.com/microsoft/vscode/issues/115482) (:+1: it) )~~ Fixed in v4.4.1
- New feature: The status bar `Error` and `Success` messages can be clicked which will open the Output Window #25

### Updates
- `autoprefixer` from `10.2.1` to `10.2.4`
  - Small bug fixes (nothing user facing)
- Various dev-dependency updates

### Fixed
- Part fix: Slow file handling #22. Full fix in v5 as some small breaking changes
  - The glob pattern matcher is causing bottlenecks, reducing load calls with small patch. However moving away from glob is the end-game (which will be happening in v5)
- Fix: `compileCurrentSass` shows wrong message on fail
  - When you run `compileCurrentSass` and it would fail (for whatever reason) it would cause the output to show `Success` rather than `Error` (just the output was wrong, nothing else)
- Fix: Status bar inconsistencies during display changes
  - When command bar is changing between visuals it was possible to cause the status and the shown message to be out of sync (due to clicks while setTimeouts are pending), the setup also meant you couldn't sync them again (unless you did a manual compile command)


## [4.3.4] - 2021-01-21

### Fixed
- Fixed [#18](https://github.com/glenn2223/vscode-live-sass-compiler/issues/18): On launch there is no output, nor any `Live SASS Compile` output selection, when the setting `watchOnLaunch` is `true`
- Fixed: Autoprefixer warning saying `undefined` for file path when `generateMap` is `false`
- Fixed: Autoprefixer `grid: "autoplace"` was forced
  - If [this feature](https://github.com/postcss/autoprefixer#does-autoprefixer-polyfill-grid-layout-for-ie) is wanted then add `/* autoprefixer grid: autoplace */` to the start of your file

### Updates
- `sass` from `1.32.4` to `1.32.5`
  - **Potentially breaking bug fix:** When using @for with numbers that have units, the iteration variable now matches the unit of the initial number. This matches the behaviour of Ruby Sass and LibSass.
  - Others: see [sass release notes](https://github.com/sass/dart-sass/releases/tag/1.32.5)

## [4.3.3] - 2021-01-18

### Fixed
- Fixed [#15](https://github.com/glenn2223/vscode-live-sass-compiler/issues/15): No longer outputs absolute path in map file and map link in CSS output
- Reinstated feature of partial files being checked for exclusion
- Autoprefixer map lines now relate to actual SASS files rather than the CSS file generated
- When there's an include list, a non partial file that's not "included" would still be processed
- Now gets the correct list of included partial files

## [4.3.2] - 2021-01-15

### Fixed
- Now handle errors caused by incorrect autoprefixer browser queries
- Corrected output for unhandled errors that get output when running "Report an issue" from the command `liveSass.command.createIssue`

### Updates
- `sass` from `1.30.0` to `1.32.4`
  - Various changes, see their [changelog](https://github.com/sass/dart-sass/blob/master/CHANGELOG.md)
- `autoprefixer` from `10.1.0` to `10.2.1`
  - Fixed transition-property warnings (by @Sheraff).
- Other, non-facing changes
  - `eslint` from `7.16.0` to `7.17.0`
  - `ts-loader` from `8.0.12` to `8.0.14`
  - `postcss` from `8.2.1` to `8.2.4`
  - `vscode-test` from `1.4.0` to `1.4.1`
  - `webpack` from `5.11.0` to `5.14.0`
  - `webpack-cli` from `4.2.0` to `4.3.0`

## [4.3.1] - 2021-01-09

### Fixed
- Fixed [#10](https://github.com/glenn2223/vscode-live-sass-compiler/issues/10): Partial SASS files not triggering compilation of all files
- Correction of output when running `liveSass.command.debugInclusion` and the file is excluded

## [4.3.0] - 2021-01-06

### Added
- Support for workspaces with multiple folders

### Changed
- **Out of preview!**
- Small optimisation to some underlying async operations

### Other
- Small bit of general tidying, adjustment to README, new dev dependency for @.types/glob

## [4.2.0] - 2020-12-22

### Added
- New debugging items
    * Two settings: 
        * `liveSass.command.debugInclusion` to check that a current file will be included based on your settings
        * `liveSass.command.debugFileList` for a more in-depth look under the hood of the files included and excluded. Which can assist when logging issues
    * New item in the [FAQ](https://github.com/glenn2223/vscode-live-sass-compiler/blob/master/docs/faqs.md) for extra help with glob patterns and reporting files not being compiled

### Changed
- Update the returned message from Autoprefixer warnings. They now better reflect that it's a warning not an error and include file information
- Updated some dependencies:
    * autoprefixer: v10.1.0
    * glob: 7.1.6
    * postcss: 8.2.1
- Also updated some dev dependencies (not effecting the extension itself)

### Other
- Moved to eslinting, prettified the Typescript files

## [4.1.0] - 2020-12-20

### Added
- New setting `liveSassCompile.settings.compileOnWatch`
    * When `true` it will automatically compile all Sass files when watching is started. *Default value is `true`*

### Changed
- Updated the issue report command text from `Create an 'Unexpected Error' issue` to `Report an issue` to simplify and be more inline with the normality.
- Now using webpack to minify and speed up the extension

### Other
- Doc changes/general tidy up, updated `.vscodeignore`, update license, update `.gitignore`


## [4.0.0] - 2020-12-20
### Breaking changes
- Output options are now only `expanded` and `compressed`
- Only works on VS Code v1.50 and over

### Fixed
- Changed from `libsass` to `sass` (more up to date release)
    * Fixes: many issues + performance improvement
- Map line numbers are correct after `autoprefixer` is applied
    * Fixes: [#279](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/279), [#242](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/242), [#70](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/70)

### Added
- Replace segments in the save path: added two new settings under `liveSassCompile.settings.formats`
    * `savePathSegmentKeys` - A list of segments to be replaced
    * `savePathReplaceSegmentsWith` - The replacement value
- New setting `liveSassCompile.settings.watchOnLaunch`
    * When `true` it will automatically start watching your `.sass` or `.scss` files on launch. *Default value is `false`*
- New logging mechanism
    * Errors are logged in a workspace folder
    * New command to help log issues for unhandled errors `liveSass.command.createIssue`

---

| Version | Date | Changelog|
| ------- | -------- | ------ |
|3.0.0 | 11.07.2018 | – ***Fixes: [[#39](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/39), [#40](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/40), [#78](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/77)]*** Upgrade `sass.js` library that included fixes for 8 digit Hex code & grid name.<br />&#9;&#9;  |
|2.2.1 | 29.06.2018 | – ***[Fixes [#77](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/77)]*** Rebuild the package |
|2.2.0 | 29.06.2018 | – ***[Fixes [#76](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/76)]*** (That was library issue. Sass.js is downgraded to `v0.10.8`)|
|2.1.0| 28.06.2018 | – ***[Fixes [#73](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/73)]*** Change detection of Partial Sass was missing in `v2.0.0` |
|2.0.0|27.06.2018|  – Fixes [#6](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/6) [#62](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/62)  <br>– Include Path Fixes  <br>– Grid Autoprefix  <br>– Autoprefix is now on by default|
|1.3.0|19.02.2018| –  ***[NEW [#41](https://github.com/ritwickdey/vscode-live-sass-compiler/pull/41)]*** <br> - added ability to suppress the output window<br> - Status bar button colour change based on `Success` and `error`.<br><br>_[Thanks a lot to [Brandon Baker](https://github.com/bmwigglestein) for submitting the PR ]_|
|1.2.0|21.12.17| – ***[New Features [#26](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/26)]*** `savePath` setting updated. You can now specify `savePath` location relative to your Sass files. *See Settings section for more details* *[Thanks [Marius](https://github.com/morsanu)]*  <br><br>– ***[Bug Fixed [#25](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/25)]*** No more extra new line in generated CSS. *[Thanks [Shahril Amri](https://github.com/redemption024)]* <br><br>–**[Bug Fixed [#33](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/33)]** Now Firefox is recognizing source SCSS file. *[Thanks [Felix](https://github.com/felix007)]*|
|1.1.0| 01.11.17 | – ***[NEW [#19](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/19)]*** Support for autoprefix in generated CSS. (see settings section for more) _[Thanks a lot to [boyum](https://github.com/boyum) for submitting the PR [#22](https://github.com/ritwickdey/vscode-live-sass-compiler/pull/22)]_ <br><br>– ***[Bug fixed [#20](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/20)]*** : Fixed `liveSassCompile.settings.includeItems` settings. *[Thanks [Hoàng Nam](https://github.com/hoangnamitc)]* |
| 1.0.1 | 10.10.17| – ***[Fixes [#17](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/17)]*** Default value `savePath` from new settings (`.formats`) is revised. If you don't set any value it will generate CSS at the same location of sass/scss as it was before. _(See settings section for more details)_ *[Thanks [2289034325](https://github.com/2289034325) & [Ibsenleo](https://github.com/ibsenleo) for the feedback]* |
| 1.0.0 |10.10.17 | – ***[New Features/settings [#10](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/10)]*** Support for multiple extensionName, formats & save locations . *[Thanks to [Trinh Xuan Manh](https://github.com/ShadowFoOrm) for the suggestion and a Special Thanks to [Ibsenleo](https://github.com/ibsenleo) for  the PR [#16](https://github.com/ritwickdey/vscode-live-sass-compiler/pull/16).]* <br><br>–***NOTE : Due to enable this feature, the `liveSassCompile.settings.format`, `.savePath`, `.extensionName` settings are dropped. [See settings section for the new setting.]*** |
|0.5.1|23.09.17| – ***[Bug Fixed [#12](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/12)]*** Sass files from excluded list was compiled on individual savings. _[Thanks [Braedin Jared](https://github.com/ImBaedin)]_ |
|0.5.0|25.08.17| – ***[New Settings]*** `liveSassCompile.settings.generateMap` : Set it as `false` if you don't want `.map` file for compiled CSS. Default is `true`. *[[#9](https://github.com/ritwickdey/vscode-live-sass-compiler/pull/9) Thanks [Mark Hewitt](https://github.com/mhco) for the PR].*|
|0.4.0|21.08.17|– ***[Renamed]*** `liveSassCompile.settings.excludeFolders` is renamed to `liveSassCompile.settings.excludeList`. <br><br>– ***[Fixed]*** You can set glob pattern to exclude files through `liveSassCompile.settings.excludeList` settings. You can also use negative glob pattern.*[For More details, follow settings section]* <br><br>– ***[New Settings [#8](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/8)  ]*** `liveSassCompile.settings.includeItems` : This setting is useful when you deals with only few of sass files. Only mentioned Sass files will be included. NOTE: No need to include partial sass files. *[Thanks [PatrickPahlke](https://github.com/PatrickPahlke)]*.|
|0.3.4|15.08.17|**[Fixed [#7](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/7)]** Duplicate Output. _[Thanks [Tomekk-hnm](https://github.com/tomekk-hnm)]_.|
|0.3.3|01.08.17|[[#5](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/5)] Critical Fix Update for Linux & macOS. (Thanks a lot to [Shea Fitzek](https://github.com/sheafitzek)). |
|0.3.2 | 01.08.17 | [Hot Fix] CSS & map link was broken. |
|0.3.1 | 30.07.17 | – Ordering of Output log is fixed.<br><br>NOTE : Lot of code (almost full code) is changed as I've refactored the source code. So, if anything is broken (Hopefully NOT :D ), feel free to open a issue request on GitHub. I'm happy to resolve the bugs. |
|0.3.0|29.07.17| – This update does not include any new feature or major fix but a big fix in source code setup. I was facing a big configuration issue between TypeScript and non-NPM third-party library since I released the extension - even I was not able to debug extension directly from TypeScript codes. Finally I am able to fix it. (I promise, more updates are coming soon...).<br> – Status bar text (at watching mode) has been changed.<br>–Package size reduced to more than 50%.|
|0.2.2|25.07.17|New Command added for one time Sass/Scss compilation. - Press `F1` or `ctrl+shift+p` and enter `Compile Sass - Without Watch Mode`.|
| 0.2.1 | 21.07.17 |[[#4](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/4)] Critical Bug Fixed update. [Thanks _[Cassio Cabral](https://github.com/cassioscabral)_].|
|0.2.0|20.07.17|[[#3](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/3)] New settings added to exclude specific folders from workspace. All Sass/Scss files inside the folders will be ignored. [Thanks _[Cassio Cabral](https://github.com/cassioscabral) for the suggestion_]. |
|0.1.2|19.07.17| Small Fix (Rename) update.|
| 0.1.1 | 14.07.17 | Fixed [#2](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/2) - Partial Sass/Sass files are not compiling in watching mode. (Thanks again, _[Kerry Smyth](https://github.com/Kerrys7777) :p_) |
|0.1.0| 13.07.17| Feature Added [#1](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/1) - Now the extension will also generate `Linker Address Map (.map)` files in the same directory of `.css` (Thanks, _[Kerry Smyth](https://github.com/Kerrys7777)_). |
|0.0.5| 11.07.17 |`liveSassCompile.settings.extensionName` settings added. |
|0.0.4 | 11.07.17 | Icon updated.|
|0.0.3 | 11.07.17 | Fix update for Linux environment.|
|0.0.2 | 11.07.17 | Small description updated.|
| 0.0.1 | 11.07.17 | Initial Preview Release with following key features. <br> – Live SASS & SCSS Compile. <br> – Customizable file location of exported CSS. <br> – Customizable exported CSS Style (`expanded`, `compact`, `compressed`, `nested`.)<br> – Quick Status bar control.<br> – Live Reload to browser (`Live Server` extension dependency). |


[5.2.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.1.1...v5.2.0
[5.1.1]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.1.0...v5.1.1
[5.1.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.0.4...v5.1.0
[5.0.4]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.0.3...v5.0.4
[5.0.3]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.0.2...v5.0.3
[5.0.2]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.0.1...v5.0.2
[5.0.1]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.4.1...v5.0.0
[4.4.1]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.3.4...v4.4.0
[4.3.4]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.3.3...v4.3.4
[4.3.3]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.3.2...v4.3.3
[4.3.2]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.3.1...v4.3.2
[4.3.1]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/glenn2223/vscode-live-sass-compiler/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/ritwickdey/vscode-live-sass-compiler/compare/v2.2.1...v3.0.0
