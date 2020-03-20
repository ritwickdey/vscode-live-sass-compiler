## Settings

* **`liveSassCompile.settings.formats`**  
To setup Format (style), Extension Name & Save location for exported CSS [Multiple Format Supported].

    * *Format can be _`expanded`_, _`compact`_, _`compressed`_ or _`nested`_. Default is  _`expanded`_*

    * *Extension Name can be `.css` or `.min.css`. **Default is `.css`***
     
    * *Save location is relative from workspace root or your Sass files (See examples)*

    <details>
    <summary>Examples</summary>
    <div>
  
    ```js
        "liveSassCompile.settings.formats":[
            // This is Default.
            {
                "format": "expanded",
                "extensionName": ".css",

                // null -> denotes the same path as the file it's formatting. Note: null not `null`
                "savePath": null
            },
            // You can add more
            {
                "format": "compressed",
                "extensionName": ".min.css",

                // / -> denotes relative to root
                "savePath": "/dist/css"
            },
            // More Complex
            {
                "format": "compressed",
                "extensionName": ".min.css",
                // ~ -> denotes relative to every sass file (Ref: 1)
                "savePath": "~/../css/"
            }
        ]
    ```
    (Ref: 1) Complex Scenario. *([Checkout the example](https://github.com/ritwickdey/vscode-live-sass-compiler/issues/26#issue-274641546))*
        
    </div>
    </details>

___

* **`liveSassCompile.settings.excludeList`**  
To Exclude specific folders. All SASS/SCSS files inside the folders will be ignored.

    <details><summary>Deafult & examples</summary><p>

    **Default**

    ```json
        "liveSassCompile.settings.excludeList": [ 
            "**/node_modules/**",
            ".vscode/**" 
        ]
    ```

    **Negative glob pattern**  
    Exclude all file except `file1.scss` & `file2.scss` from `path/subpath` directory, you can use the expression
    ```json
        "liveSassCompile.settings.excludeList": [
            "path/subpath/*[!(file1|file2)].scss"
        ]
    ```

    </p></details>

___

* **`liveSassCompile.settings.includeItems`**  
This setting is useful when you deals with only few of sass files. Only mentioned Sass files will be included. 

    *  *NOTE: No need to include partial sass files.*
    *  *Default value is `null`* 

    <details><summary>Examples</summary><p>

    **Example**
    ```json
        "liveSassCompile.settings.includeItems": [
            "path/subpath/a.scss",
            "path/subpath/b.scss",
        ]
    ``` 
    </p></details>

___

* **`liveSassCompile.settings.generateMap`**  
Set it as `false` if you don't want `.map` file for compiled CSS. 
    * _Default is `true`._

___

* **`liveSassCompile.settings.autoprefix`**  
Automatically add vendor prefixes to unsupported CSS properties (e. g. `transform` -> `-ms-transform`). 
    
    * _Specify what browsers to target with an array of strings (uses [Browserslist](https://github.com/browserslist/browserslist#query-composition))._ 

    <details>
    <summary>Default</summary>
    <p>

    **Default**
     ```json
       "liveSassCompile.settings.autoprefix": [
           "> 0.5%",
           "last 2 versions",
           "Firefox ESR",
           "not dead"
        ]
     ``` 
    </p></details>

___

* **`liveSassCompile.settings.showOutputWindow`**  
Set this to `false` if you do not want the output window to show.
    * *NOTE: You can use the command palette to open the Live Sass output window.*
    * *Default value is `true`*

___

* **`liveSassCompile.settings.watchOnLaunch`**  
Set this to `true` to watch files on launch.
    * *Default value is `false`*