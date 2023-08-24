# vscode-pycmd

The `extension.pycmd` command runs the first complete python expression following the active-editor cursor in the active terminal.

```json
{
   "key": "ctrl+enter",
   "command": "extension.pycmd",
   "when": "editorTextFocus && editorLangId == 'python'"
}
```