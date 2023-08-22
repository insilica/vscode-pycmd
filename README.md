# vscode-pycmd

`pycmd` provides a command that runs the active python expression in the active terminal. Below is a sensible way to use it in keybindings:

```json
{
   "key": "ctrl+enter",
   "command": "extension.pycmd",
   "when": "editorTextFocus && editorLangId == 'python'"
}
```