# Settings & Commands

## Contents
- [Settings](#Settings)
- [Commands](#Commands)
- [Notes](#Notes)

## Settings

### liveSassCompile.settings.formats
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

An array of formats. Allows you save to multiple locations, with a customisable format and extension for each

Properties | Type | Default | Notes
-- | -- | -- | --
format | `expanded` OR `compressed` | `expanded` | The output style of the generated file
extensionName | `.css` OR `.min.css` | `.css` | The extension appended to the outputted file
savePath | `string?` | `null` | See [save path notes]
savePathSegmentKeys | `string[]?` | `null` | See [save path notes]
savePathReplaceSegmentsWith | `string?` | `null` | See [save path notes]
linefeed | `cr` OR `crlf` OR `lf` OR `lfcr` | `lf` | The linefeed terminator to use
indentType | `space` OR `tab` | `space` | The indentation to use for the `expanded` format
indentWidth | `number` | `2` | The indentation width used for the `expanded` format

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
        "savePathSegmentKeys": null,
        "savePathReplaceSegmentsWith": null
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
        "extensionName": ".min.css",

        // ~ -> denotes relative to each sass file
        "savePath": "~/../css/"
    },
    // Segment replacement example
    {
        "format": "compressed",
        "extensionName": ".min.css",

        // "/Assets/SCSS/main.scss" -> translates to "/Assets/Style/main.css"
        // "/Assets/_SASS/main.sass" -> translates to "/Assets/Style/main.css"
        "savePathSegmentKeys": [
            "SCSS",
            "_SASS"
        ],
        "savePathReplaceSegmentsWith": "Style",
    // Segment replacement ONLY applied if "savePath" is null
    {
        "format": "compressed",
        "extensionName": ".min.css",

        // "/Assets/SCSS/main.scss" -> translates to "/dist/css/main.css" NOT "/Assets/Style/main.css"
        "savePath": "/dist/css",
        "savePathSegmentKeys": [
            "SCSS"
        ],
        "savePathReplaceSegmentsWith": "Style"
    }
]
```

</details>

---

### liveSassCompile.settings.excludeList
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

Use an array of various glob patterns to exclude files or entire folders. All matching SASS/SCSS files or matching folders will be ignored.

**Type:** `string[]?`  
**Default**
```json
[ "/**/node_modules/**", "/.vscode/**" ]
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
Match alphas, alpha numerics, words and [more][Full POSIX List]

```json
"liveSassCompile.settings.excludeList": [
    "/path/subpath/[:word:]+.scss"
]
```

</details>

---

### liveSassCompile.settings.includeItems
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

Process only these specified files. Useful for when you deal with only a few sass files.

**Type:** `string[]?`  
**Default:** `null`

***NOTE:** there is no need to include partial sass files.*

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

### liveSassCompile.settings.generateMap
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

Create a companion map file for each of the compiled files

**Type:** `boolean`  
**Default:** `true`

</details>

---

### liveSassCompile.settings.autoprefix
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

Autoprefix unsupported CSS properties (e.g. `transform` will also add `-ms-transform`). Uses [Browserslist] for browser selection

**Type:** `boolean` OR `string[]`  
**Default:** `"defaults"`

- A `string[]` will override the default browsers to add prefixes for
- When `false` Autoprefixer is disabled
- When `true` we will try and search for either:
  - a `.browserlistsrc` file or,
  - `"browserslist": [ string[] ]` in your `package.json` file

    If neither of these are found then Autoprefixer will use `"defaults"`

---

### liveSassCompile.settings.showOutputWindowOn
Set the logging level at which errors will be shown in the output window. *There is also a [command](#livesasscommandopenoutputwindow)*.

**Type:** `Trace`, `Debug`, `Information`, `Warning`, `Error` or `None`  
**Default:** `Information`

<details>
<summary> Choosing the right output level </summary>

- `None`: almost no output
  - Running the `liveSass.command.debugInclusion` (`Check file will be included`) command
  - Running the `liveSass.command.debugFileList` (`Get all included files`) command
  - When the `forceBaseDirectory` is not found or invalid (i.e. a file instead of a folder)
- `Error`: this will output when compilation errors  
    All of the above, plus
  - When there is an error or `@error` in your SASS
  - When autoprefixer errors, or is passed an invalid browserslist setting
  - If saving a file to the disk fails
- `Warning`: this will output non-critical issues  
    All of the above, plus
  - Primarily, workspace folder issues
- `Information`: this will output file information  
    All of the above, plus
  - When compilation is starting
  - When files have been generated (it outputs all files)
  - When the watch state is changed
- `Debug`: this will output some info to help with debugging  
    All of the above, plus
  - Details as to why files aren't compiling (not SASS, no active file, etc.)
  - Details of which files are being processed
- `Trace`: this is primarily to aid in resolving problems  
    All of the above, plus
  - A lot of sub-process by sub-process details of progress

</details>

---

### liveSassCompile.settings.watchOnLaunch
Defines whether Live Sass should watch immediately over waiting to be started 

**Type:** `boolean`  
**Default:** `false`

---

### liveSassCompile.settings.compileOnWatch
Defines whether Live Sass should compile all files when it starts watching

**Type:** `boolean`  
**Default:** `true`

---

### liveSassCompile.settings.forceBaseDirectory
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

Defines a subdirectory to search from. Add a small performance gain by targeting just your SASS folder.

No SASS/SCSS files outside of this folder will be watched/compiled when you save.

**Type:** `string?`  
**Default:** `null`

>**⚠ It is your responsibility to ensure the path exists and is correct.**  
If the path is not found, or is a file, then it will output an error  
If the path is wrong then nothing will be found nor compiled

>**⚠ This setting effects the root path for `includeItems` and `excludeList`**. So, a setting of `/Assets` means that `includeItems` and `excludeList` are both relative to `/Assets` and not `/` (the root of the workspace folder)

## Commands
To use any command, start by pressing <kbd>F1</kbd> OR (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>) + <kbd>Shift</kbd> + <kbd>P</kbd>. You can then enter a `name` for any of the commands below.

### liveSass.command.watchMySass
Start watching for SASS/SCSS changes

**Names:** `Live SASS: Watch Sass`, `liveSass.command.watchMySass`

---

### liveSass.command.donotWatchMySass
Stop watching for SASS/SCSS changes

**Names:** `Live SASS: Stop Watching`, `liveSass.command.donotWatchMySass`

---

### liveSass.command.compileCurrentSass
Compile the currently opened SASS/SCSS file

**Names:** `Live SASS: Compile Current Sass File`, `liveSass.command.compileCurrentSass`

---

### liveSass.command.oneTimeCompileSass
Perform a one time compilation of all SASS/SCSS files, regardless of whether we're watching or not

**Names:** `Live SASS: Compile Sass - Without Watch Mode`, `liveSass.command.oneTimeCompileSass`

---

### liveSass.command.openOutputWindow
Open the Live SASS output window

**Names:** `Live SASS: Open Live Sass Output Window`, `liveSass.command.openOutputWindow`

---

### liveSass.command.createIssue
When an alert pops up in the bottom right corner, you can report that issue directly by running this command. You can use it for general errors, however it will not include details of your specific issue, you will have to include the details yourself

**Names:** `Live SASS: Report an issue`, `liveSass.command.createIssue`

---

### liveSass.command.debugInclusion
Check if the current file will be included, based on your current settings. A good start to debug any glob pattern issues that might stop the current file from compiling

**Names:** `Live SASS: Check file will be included`, `liveSass.command.debugInclusion`

---

### liveSass.command.debugFileList
Get a full list of files that are included, any partials that will trigger compilation of all files and also any excluded files. Helpful to debug any glob pattern issue's you're having

**Names:** `Live SASS: Get all included files`, `liveSass.command.debugFileList`

---

### liveSass.command.showOutputOn...
This heading actually applies to 6 different commands. However, they all share the same prefix. I have highlighted each command in the list below.

Applying this command will change the output logging level that is used by this extension.

- **Trace:**
  - **Names:** `Live SASS: Show Output On: Trace`, `liveSass.command.showOutputOn.trace`
- **Debug:**
  - **Names:** `Live SASS: Show Output On: Debug`, `liveSass.command.showOutputOn.debug`
- **Information:**
  - **Names:** `Live SASS: Show Output On: Information`, `liveSass.command.showOutputOn.information`
- **Warning:**
  - **Names:** `Live SASS: Show Output On: Warning`, `liveSass.command.showOutputOn.warning`
- **Error:**
  - **Names:** `Live SASS: Show Output On: Error`, `liveSass.command.showOutputOn.error`
- **None:**
  - **Names:** `Live SASS: Show Output On: None`, `liveSass.command.showOutputOn.none`

## Notes

### Multi-root workspaces
Settings that can be applied at a workspace level and at root level will have a heading like the one below  
>ℹ This setting can vary between workspace folders - [read more][Multi-rootFAQ]

Not sure what a multi-root workspace is, then [why not read more][multi-root workspaces]?

To summarise; these settings can be applied at the `.code-workspace` level .However, they can be overridden by settings in a `\.vscode\settings.json` file in any workspace root folder.  
For example, if a `.code-workspace` setting is `/src/Sass` but a `settings.json` is `/Assets/Style` then `/Assets/Style` would be used

### Save path settings
The final save path is dependant on three settings: `savePath`, `savePathSegmentKeys` and `savePathReplaceSegmentsWith`. However, `savePath` takes precedence over all three.

- Using `savePath`
  - Starting with `/` or `\` means the path is relative to the workspace root
  - Starting with `~/` or `~\` means that it's relative to the file being processed
- Using `savePathSegmentKeys` and `savePathReplaceSegmentsWith`
  - Any `savePathSegmentKeys` that are found will be replaced with the `savePathReplaceSegmentsWith`. The `savePathSegmentKeys` is an exact folder, this means you can not do `"Folder 1/Folder 2"`

[save path notes]: #save-path-notes
[Full POSIX List]: https://github.com/micromatch/picomatch#posix-brackets
[Browserslist]: https://github.com/browserslist/browserslist#query-composition
[multi-root workspaces]: https://github.com/glenn2223/vscode-live-sass-compiler/blob/master/docs/faqs.md#q-so-about-multi-root-workspaces
[Multi-rootFAQ]:  #multi-root-workspaces
