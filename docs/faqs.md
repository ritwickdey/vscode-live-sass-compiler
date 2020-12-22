
## FAQ (For Beginners)

### How to config the settings in my project?

Create a `.vscode` folder in the root of project. Inside of `.vscode` folder create a JSON file named `settings.json`.
Inside of the `settings.json`, type following key-value pairs. By the way you'll get intellisense.

```json
{
     "liveSassCompile.settings.formats":[
        {
            "format": "expanded",
            "extensionName": ".css",
            "savePath": "/css"
        },
        {
            "extensionName": ".min.css",
            "format": "compressed",
            "savePath": "/dist/css"
        }
    ],
    "liveSassCompile.settings.excludeList": [
       "**/node_modules/**",
       ".vscode/**"
    ],
    "liveSassCompile.settings.generateMap": true,
    "liveSassCompile.settings.autoprefix": [
        "> 0.5%",
        "last 2 versions",
        "Firefox ESR",
        "not dead"
    ]
}
```

### My files aren't compiling

A common issue is the glob patterns used in the include/exclude settings, please [check your glob pattern](https://globster.xyz/) first.
1. Open the command pallete (`F1` or the `(Ctrl/Cmd) + P` keys)
1. Run `liveSass.command.debugInclusion`, this will open the output and tell you if the file is included based on your settings
1. If you can't resolve the issue with the information present then move on below
1. Next run `liveSass.command.debugFileList`
1. Try to resolve your issue using the returned information in the output
1. Still no luck? 
    - Run `liveSass.command.createIssue`
    - Information is automatically placed in your clipboard and your browser will open a new window
    - Please make sure to paste the information, which is now in your clipboard, into the location stated. Also include the information returned in the `liveSass.command.debugFileList` command