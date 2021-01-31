## Settings

<details>
    <summary>
        liveSassCompile.settings.formats<br />
        An array of formats. Allows you save to multiple locations, with a customisable format and extension for each
    </summary>

Each format will have the following items:
* `format`: the output format of the generated file  
_`expanded`_, or _`compressed`_.  
_**Default is `expanded`**_

* `extensionName`: the extension applied to the generate file  
_`.css`_ or _`.min.css`_.  
_**Default is `.css`**_
    
* `savePath`, `savePathSegmentKeys` and `savePathReplaceSegmentsWith`: these dictate the save path _**(see examples)**_

<details>
<summary>Default & examples</summary>

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
        "format": "nested",
        "extensionName": ".min.css",

        // ~ -> denotes relative to each sass file
        "savePath": "~/../css/"
    },
    // Segment replacement example
    {
        "format": "compact",
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
</details>

---

<details>
<summary>
    liveSassCompile.settings.excludeList<br />
    Exclude specific files and folders.
</summary>

Use a [glob pattern] to exclude files or entire folders. All matching SASS/SCSS files or folders will be ignored.

<details>
<summary>Default & examples</summary>

**Default**

```json
"liveSassCompile.settings.excludeList": [ 
    "**/node_modules/**",
    ".vscode/**" 
]
```

**Negative [glob pattern]**  
To exclude all files except `file1.scss` & `file2.scss` from the directory `path/subpath`, you can use the expression:

```json
"liveSassCompile.settings.excludeList": [
    "path/subpath/*[!(file1|file2)].scss"
]
```

</details>
</details>

---

<details>
<summary>
    liveSassCompile.settings.includeItems<br />
    Process only these specified files
</summary>

Useful for when you deal with only few of sass files.

*  _**NOTE:** no need to include partial sass files._
*  _**Default:** `null`_

<details>
<summary>Examples</summary>

**Example**
```json
"liveSassCompile.settings.includeItems": [
    "path/subpath/a.scss",
    "path/subpath/b.scss",
]
``` 
</details>
</details>

---

<details>
<summary>
    liveSassCompile.settings.generateMap<br />
    Create a map file when compiling files
</summary>

Set it as `false` if you don't want a `.map` file for compiled CSS. 
* _**Default:** `true`._

</details>

---

<details>
<summary>
    liveSassCompile.settings.autoprefix<br />
    Autoprefix unsupported CSS properties (e.g. transform -> -ms-transform)
</summary>
    
_Specify what browsers to target with an array of strings (uses [Browserslist](https://github.com/browserslist/browserslist#query-composition))._ 

<details>
<summary>Default</summary>

```json
"liveSassCompile.settings.autoprefix": [
    "> 0.5%",
    "last 2 versions",
    "Firefox ESR",
    "not dead"
]
``` 
</details>
</details>

---

<details>
<summary>
    liveSassCompile.settings.showOutputWindow<br />
    Optionally displays the output window when compiling
</summary>

Set this to `false` if you do not want the output window to show.

* _**NOTE:** You can use the command palette to open the Live Sass output window._
* _**Default:** `true`_

</details>

---

<details>
<summary>
    liveSassCompile.settings.watchOnLaunch<br />
    Defines whether Live Sass should watch immediately over waiting to be started 
</summary>

Set this to `true` to watch files on launch.
* _**Default:** `false`_

</details>

---

<details>
<summary>
    liveSassCompile.settings.compileOnWatch<br />
    Defines whether Live Sass should compile all files when it starts watching
</summary>

Set this to `false` if you don't want all Sass files to be compiled when Live Sass Compiler starts watching. 
* _**Default:** `true`_

</details>

---

<details>
<summary>
    liveSassCompile.settings.forceBaseDirectory<br />
    Defines a subdirectory to search from (speed gains on larger projects)
</summary>

Larger projects can have performance problems, using this to target just your sass folder will provide performance gains.

No Sass/Scss files outside of this folder will be watched/compiled when you save.

* _**Default:** `null`_
* _**Note:** No leading slash but MUST have ending slash_
  * _Example: `src/style/`_
* _**Note for multi-root workspaces:** This setting can be applied at workspace level however it can not vary from root to root. (opened [feature request](https://github.com/microsoft/vscode/issues/115482) on VS Code source)_

</details>

[glob pattern]: https://github.com/isaacs/node-glob/blob/master/README.md#glob-primer