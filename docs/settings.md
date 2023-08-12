# Settings & Commands

> ℹ️ Hey! There's a video that goes through these settings.  
> Watch it on [YouTube](https://youtu.be/6Wo3mYBLNyA) now!

**Contents**

-   [Settings](#Settings)
-   [Commands](#Commands)
-   [Notes](#Notes)

# Settings

## liveSassCompile.settings.formats

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

An array of formats. Allows you save to multiple locations, with a customisable format and extension for each

| Properties                | Type                             | Default    | Notes                                                                |
| ------------------------- | -------------------------------- | ---------- | -------------------------------------------------------------------- |
| format                    | `expanded` OR `compressed`       | `expanded` | The output style of the generated file                               |
| extensionName             | `string`                         | `.css`     | The extension suffix added to the output file (must end with `.css`) |
| savePath                  | `string?`                        | `null`     | See [save path notes]                                                |
| savePathReplacementPairs  | `Record<string, string>?`        | `null`     | See [save path notes]                                                |
| generateMap               | `boolean?`                       | `null`     | Choose to output maps at a format level instead                      |
| <sup>Ŧ</sup>_linefeed_    | `cr` OR `crlf` OR `lf` OR `lfcr` | `lf`       | The linefeed terminator to use                                       |
| <sup>Ŧ</sup>_indentType_  | `space` OR `tab`                 | `space`    | The indentation to use for the `expanded` format                     |
| <sup>Ŧ</sup>_indentWidth_ | `number`                         | `2`        | The indentation width used for the `expanded` format                 |

<small><sup>Ŧ</sup> These will be removed in SASS v2.0 and are currently unavailable when `liveSassCompile.settings.useNewCompiler` is `true`</small>

<details>
<summary>Examples</summary>

```js
"liveSassCompile.settings.formats": [
    // This is the default.
    {
        "format": "expanded",
        "extensionName": ".css",

        // null for all three -> denotes the same path as the SASS file
        "savePath": null,
        "savePathReplacementPairs": null
    },
    // You can add more
    {
        "format": "compressed",
        "extensionName": ".min.css",

        // / -> denotes relative to the workspace root
        "savePath": "/dist/css"
    },
    // More Complex
    // (See issue 26: https://github.com/ritwickdey/vscode-live-sass-compiler/issues/26)
    {
        "format": "compressed",
        "extensionName": ".m.css",

        // ~ -> denotes relative to each sass file
        "savePath": "~/../css/"
    },
    // Segment replacement example
    {
        "format": "compressed",
        "extensionName": ".min.css",

        // "/Assets/SCSS/main.scss" => "/Assets/Style/main.min.css"
        // "/Assets/_SASS/main.sass" => "/Assets/Style/main.min.css"
        "savePathReplacementPairs": {
            "/SCSS/": "/Style/",
            "/_SASS/": "/Style/"
        },

        // Don't create a map file for this "production" output
        "generateMap": false
    // Segment replacement can work with relative `savePath`s
    {
        "format": "compressed",
        "extensionName": "-min.css",

        // "/src/sass/Homepage/AHH/main.scss" => "/dist/css/Homepage/main-min.css"
        "savePath": "~/..",
        "savePathReplacementPairs": {
            "/src/sass": "/dist/css/"
        }
    }
]
```

</details>

---

## liveSassCompile.settings.excludeList

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Use an array of various glob patterns to exclude files or entire folders. All matching SASS/SCSS files or matching folders will be ignored.

**Type:** `string[]?`  
**Default**

```json
["/**/node_modules/**", "/.vscode/**"]
```

<details>
<summary>Other examples</summary>

**Negative glob pattern**  
To exclude all files except `file1.scss` & `file2.scss` from the directory `path/subpath`, you can use the expression:

```json
"liveSassCompile.settings.excludeList": [
    "/path/subpath/*[!(file1|file2)].scss"
]
```

**Regex pattern**
Match regex expressions

```json
"liveSassCompile.settings.excludeList": [
    "/path/subpath/[A-Za-z0-9_]+.scss"
]
```

**POSIX brackets - [Full POSIX List]**  
Match alphas, alpha numerics, words and [more][full posix list]

```json
"liveSassCompile.settings.excludeList": [
    "/path/subpath/[:word:]+.scss"
]
```

</details>

---

## liveSassCompile.settings.includeItems

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Process only these specified files. Useful for when you deal with only a few sass files.

**Type:** `string[]?`  
**Default:** `null`

_**NOTE:** there is no need to include partial sass files._

<details>
<summary>Example</summary>

```json
"liveSassCompile.settings.includeItems": [
    "/path/subpath/a.scss",
    "/path/subpath/b.scss",
]
```

</details>

---

## liveSassCompile.settings.partialsList

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Using glob patterns, specify what files are actually partials - or what folders contain them

**Type:** `string[]`  
**Default**

```JSON
[ "/**/_*.s[ac]ss" ]
```

---

## liveSassCompile.settings.generateMap

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Create a companion map file for each of the compiled files  
**Note:** this can be overwritten in the `formats[].generateMap` setting

**Type:** `boolean`  
**Default:** `true`

---

## liveSassCompile.settings.autoprefix

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Autoprefix unsupported CSS properties (e.g. `transform` will also add `-ms-transform`). Uses [Browserslist] for browser selection

**Type:** `boolean` OR `string[]`  
**Default:** `"defaults"`

-   A `string[]` will override the default browsers to add prefixes for
-   When `false` Autoprefixer is disabled
-   When `true` we will try and search for either:

    -   a `.browserslistrc` file or,
    -   `"browserslist": [ string[] ]` in your `package.json` file

        If neither of these are found then Autoprefixer will use `"defaults"`

**Note:** for backwards compatibility with the original extension `null` is permitted. This has the same result as providing `false`

---

## liveSassCompile.settings.showOutputWindowOn

Set the logging level at which errors will be shown in the output window. _There is also a [command](#livesasscommandopenoutputwindow)_.

**Type:** `Trace`, `Debug`, `Information`, `Warning`, `Error` or `None`  
**Default:** `Information`

<details>
<summary> Choosing the right output level </summary>

-   `None`: almost no output
    -   Running the `liveSass.command.debugInclusion` (`Check file will be included`) command
    -   Running the `liveSass.command.debugFileList` (`Get all included files`) command
    -   When the `forceBaseDirectory` is not found or invalid (i.e. a file instead of a folder)
-   `Error`: this will output when compilation errors  
     All of the above, plus
    -   When there is an error or `@error` in your SASS
    -   When autoprefixer errors, or is passed an invalid browserslist setting
    -   If saving a file to the disk fails
-   `Warning`: this will output non-critical issues  
     All of the above, plus
    -   Primarily, workspace folder issues
-   `Information`: this will output file information  
     All of the above, plus
    -   When compilation is starting
    -   When files have been generated (it outputs all files)
    -   When the watch state is changed
-   `Debug`: this will output some info to help with debugging  
     All of the above, plus
    -   Details as to why files aren't compiling (not SASS, no active file, etc.)
    -   Details of which files are being processed
-   `Trace`: this is primarily to aid in resolving problems  
     All of the above, plus
    -   A lot of sub-process by sub-process details of progress

</details>

---

## liveSassCompile.settings.showOutputWindow

> ℹ This setting is deprecated in favour of `showOutputWindowOn`. However, it will likely never be removed

This setting exists for backwards compatibility with the original extension

When `true` the extension will output all `Information` level messages (from above setting). When `false` it will report all `Warning` level messages (from above setting).

**Type:** `boolean?`
**Default:** `null`

---

## liveSassCompile.settings.watchOnLaunch

Defines whether Live Sass should watch immediately over waiting to be started

**Type:** `boolean`  
**Default:** `false`

---

## liveSassCompile.settings.compileOnWatch

Defines whether Live Sass should compile all files when it starts watching

**Type:** `boolean`  
**Default:** `true`

---

## liveSassCompile.settings.forceBaseDirectory

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Defines a subdirectory to search from. Add a small performance gain by targeting just your SASS folder.

No SASS/SCSS files outside of this folder will be watched/compiled when you save.

**Type:** `string?`  
**Default:** `null`

> **⚠ It is your responsibility to ensure the path exists and is correct.**  
> If the path is not found, or is a file, then it will output an error  
> If the path is wrong then nothing will be found nor compiled

> **⚠ This setting effects the root path for `includeItems` and `excludeList`**. So, a setting of `/Assets` means that `includeItems` and `excludeList` are both relative to `/Assets` and not `/` (the root of the workspace folder)

---

## liveSassCompile.settings.rootIsWorkspace

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Tells the compiler that a leading slash is relative to the workspace root rather than the drive root.

**Type:** `boolean`  
**Default:** `false`

---

## liveSassCompile.settings.useNewCompiler

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

SASS have introduced a new entry point in their JS API. This new API is designed to be more performant than the old one. Go on, kick the tyres on this new entry point (before it comes mandatory in SASS 2.0).

> **Warning**  
> This method does not apply any of the following settings (and never will <sup>[[ref]](https://github.com/sass/dart-sass/issues/1585#issuecomment-1005184692)</sup>)
>
> -   `liveSassCompile.settings.formats[].linefeed`
> -   `liveSassCompile.settings.formats[].indentType`
> -   `liveSassCompile.settings.formats[].indentWidth`

**Type:** `boolean`  
**Default:** `false`

---

## liveSassCompile.settings.showAnnouncements

Stop announcements each time a new version is installed.

**Type:** `boolean`  
**Default:** `true`

# Commands

To use any command, start by pressing <kbd>F1</kbd> OR (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>) + <kbd>Shift</kbd> + <kbd>P</kbd>. You can then enter a `name` for any of the commands below.

## liveSass.command.watchMySass

Start watching for SASS/SCSS changes

**Names:** `Live SASS: Watch Sass`, `liveSass.command.watchMySass`

---

## liveSass.command.donotWatchMySass

Stop watching for SASS/SCSS changes

**Names:** `Live SASS: Stop Watching`, `liveSass.command.donotWatchMySass`

---

## liveSass.command.compileCurrentSass

Compile the currently opened SASS/SCSS file

**Names:** `Live SASS: Compile Current Sass File`, `liveSass.command.compileCurrentSass`

---

## liveSass.command.oneTimeCompileSass

Perform a one time compilation of all SASS/SCSS files, regardless of whether we're watching or not

**Names:** `Live SASS: Compile Sass - Without Watch Mode`, `liveSass.command.oneTimeCompileSass`

---

## liveSass.command.openOutputWindow

Open the Live SASS output window

**Names:** `Live SASS: Open Live Sass Output Window`, `liveSass.command.openOutputWindow`

---

## liveSass.command.createIssue

When an alert pops up in the bottom right corner, you can report that issue directly by running this command. You can use it for general errors, however it will not include details of your specific issue, you will have to include the details yourself

**Names:** `Live SASS: Report an issue`, `liveSass.command.createIssue`

---

## liveSass.command.debugInclusion

Check if the current file will be included, based on your current settings. A good start to debug any glob pattern issues that might stop the current file from compiling

**Names:** `Live SASS: Check file will be included`, `liveSass.command.debugInclusion`

---

## liveSass.command.debugFileList

Get a full list of files that are included, any partials that will trigger compilation of all files and also any excluded files. Helpful to debug any glob pattern issue's you're having

**Names:** `Live SASS: Get all included files`, `liveSass.command.debugFileList`

---

## liveSass.command.showOutputOn...

This heading actually applies to 6 different commands. However, they all share the same prefix. I have highlighted each command in the list below.

Applying this command will change the output logging level that is used by this extension.

-   **Trace:**
    -   **Names:** `Live SASS: Show Output On: Trace`, `liveSass.command.showOutputOn.trace`
-   **Debug:**
    -   **Names:** `Live SASS: Show Output On: Debug`, `liveSass.command.showOutputOn.debug`
-   **Information:**
    -   **Names:** `Live SASS: Show Output On: Information`, `liveSass.command.showOutputOn.information`
-   **Warning:**
    -   **Names:** `Live SASS: Show Output On: Warning`, `liveSass.command.showOutputOn.warning`
-   **Error:**
    -   **Names:** `Live SASS: Show Output On: Error`, `liveSass.command.showOutputOn.error`
-   **None:**
    -   **Names:** `Live SASS: Show Output On: None`, `liveSass.command.showOutputOn.none`

# Notes

## Multi-root workspaces

Settings that can be applied at a workspace level and at root level will have a heading like the one below

> ℹ This setting can vary between workspace folders - [read more][multi-rootfaq]

Not sure what a multi-root workspace is, then [why not read more][multi-root workspaces]?

To summarise; these settings can be applied at the `.code-workspace` level .However, they can be overridden by settings in a `/.vscode/settings.json` file in any workspace root folder.  
For example, if a `.code-workspace` setting is `/src/Sass` but a `settings.json` is `/Assets/Style` then `/Assets/Style` would be used

## Save path notes

The final save path is dependant on two settings: `savePath` and `savePathReplacementPairs`. They can be stacked, but `savePath` is applied first.

-   Using `savePath`
    -   Starting with `/` or `\` means the path is relative to the workspace root
    -   Starting with `~/` or `~\` means that it's relative to the file being processed
-   Using `savePathReplacementPairs`
    -   Any keys that are found will be directly replaced with its' value. To save false matches, I'd recommend starting and ending with a slash

[save path notes]: #save-path-notes
[full posix list]: https://github.com/micromatch/picomatch#posix-brackets
[browserslist]: https://github.com/browserslist/browserslist#query-composition
[multi-root workspaces]: https://github.com/glenn2223/vscode-live-sass-compiler/blob/master/docs/faqs.md#q-so-about-multi-root-workspaces
[multi-rootfaq]: #multi-root-workspaces
