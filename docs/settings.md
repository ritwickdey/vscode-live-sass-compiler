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
