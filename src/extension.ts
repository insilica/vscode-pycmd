import * as vscode from 'vscode';
import * as cp from 'child_process';

function getLeadingWhitespace(text: string): string {
	const matchResult = text.match(/^\s*/);
	return matchResult ? matchResult[0] : '';
}

function checkExpression(text: string): boolean {
	const pyscript = __dirname + '/../scripts/check_expression.py';
	const result = cp.execSync(`python3 ${pyscript} "${text}"`).toString();
	return result.trim() === 'Valid';
}

function pyexpr(editor: vscode.TextEditor, terminal: vscode.Terminal){
	let lineNumber = editor.selection.active.line;
	let doc = editor.document;
	let text = doc.lineAt(lineNumber).text;

	// Remove leading whitespace from the first line
	const leadingWhitespace = getLeadingWhitespace(text)
	text = text.replace(leadingWhitespace, '');

	let validexpr = checkExpression(text);
	if (validexpr) { return text }

	let nextLine = lineNumber + 1;

	while (nextLine < doc.lineCount) {
		let nextLineText = doc.lineAt(nextLine).text.replace(leadingWhitespace, '');

		// If the next line is empty, continue
		if (nextLineText.length === 0) { nextLine++; continue }
		
		let whitespace = getLeadingWhitespace(nextLineText);
		
		// if the next line is not indented add newline and break
		if (whitespace.length === 0) { text += "\n"; break }

		text = text + '\n' + nextLineText;

		nextLine++;
	}

	validexpr = checkExpression(text);
	if (validexpr) { return text }else{ return null }
}

function pycmd(editor: vscode.TextEditor, terminal: vscode.Terminal){

	// If there is a selection, send that to the terminal
	if (!editor.selection.isEmpty) {
		terminal.sendText(editor.document.getText(editor.selection) + '\n');
		return;
	}
	
	// Otherwise try to build the expression starting at the active line
	let expr = pyexpr(editor, terminal);
	if (expr === null) { return }
	
	// Move cursor to the end of the expression
	let numlines = expr.split('\n').length;
	let curline = editor.selection.active.line;
	let newpos = Math.min(curline + numlines, editor.document.lineCount - 1)
	let curindent = editor.document.lineAt(curline).firstNonWhitespaceCharacterIndex;
	const newPosition = new vscode.Position(newpos, curindent);
	editor.selection = new vscode.Selection(newPosition, newPosition);

	terminal.sendText(`${expr}\n`);
}

export function activate(context: vscode.ExtensionContext) {
	let cmd = vscode.commands.registerCommand('extension.pycmd', () => { 
		const editor = vscode.window.activeTextEditor;
		const terminal = vscode.window.activeTerminal;
		if (editor && terminal) {
			pycmd(editor, terminal) 
		}
	});
	context.subscriptions.push(cmd);
}

export function deactivate() {}
