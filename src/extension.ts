import * as vscode from 'vscode';
import * as cp from 'child_process';

function getLeadingWhitespace(text: string): string {
	const matchResult = text.match(/^\s*/);
	return matchResult ? matchResult[0] : '';
}

function numExpressions(text: string): number {
	const pyscript = __dirname + '/../scripts/check_expression.py';
	let result = cp.execSync(`python3 ${pyscript} "${text}"`)
	return parseInt(result.toString().trim())
}

// TODO This could be more efficient by calling ast.parse less often
function pyexpr(editor: vscode.TextEditor, terminal: vscode.Terminal){
	let lineNumber = editor.selection.active.line;
	let doc = editor.document;
	let text = doc.lineAt(lineNumber).text;

	// Remove leading whitespace from the first line
	const leadingWhitespace = getLeadingWhitespace(text)
	text = text.replace(leadingWhitespace, '');

	let nextLine = lineNumber + 1;
	
	if(numExpressions(text) === 1) { return text; }

	let expr = ""
	while (nextLine < doc.lineCount) {
		let nextLineText = doc.lineAt(nextLine).text.replace(leadingWhitespace, '');

		text = text + '\n' + nextLineText;
		nextLine++;

		let nexpr = numExpressions(text)
        if(nexpr > 1){ break; } // break if multiple expressions
        if(nexpr === 1){ expr = text; } // save if single expression
	}
	
	return expr;
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

	expr = expr.endsWith('\n\n') ? expr : expr + '\n';
	terminal.sendText(`${expr}`);
	
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
