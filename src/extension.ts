import * as vscode from 'vscode';
import * as cp from 'child_process';

let pyProcess: cp.ChildProcess;

function getPythonProcess() {
    if (pyProcess) { return pyProcess; }
    const scriptPath = __dirname + '/../scripts/check_expression.py';
    pyProcess = cp.spawn('python3', [scriptPath]);

    // Handle errors when spawning the child process
    pyProcess.on('error', (error) => {
        console.error(`Failed to start Python process: ${error}`);
        vscode.window.showErrorMessage(`Failed to start Python process: ${error.message}`);
    });

    // Optionally log standard error
    pyProcess.stderr.on('data', (data) => {
        console.error(`Python process stderr: ${data}`);
    });

    return pyProcess;
}


function getLeadingWhitespace(text: string): string {
	const matchResult = text.match(/^\s*/);
	return matchResult ? matchResult[0] : '';
}

async function numExpressions(text: string): Promise<number> {
	const pyProcess = getPythonProcess();
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout')), 10000); // 1-second timeout
        pyProcess.stdout.once('data', (data: Buffer) => {
            clearTimeout(timer);
            resolve(parseInt(data.toString().trim()));
        });
        pyProcess.stdin.write(text + '\nEND\n');
    });
}

async function pyexpr(editor: vscode.TextEditor, terminal: vscode.Terminal){
	try {
		const pyProcess = getPythonProcess();
		let lineNumber = editor.selection.active.line;
		let doc = editor.document;
		let text = doc.lineAt(lineNumber).text;

		// Remove leading whitespace from the first line
		const leadingWhitespace = getLeadingWhitespace(text)
		text = text.replace(leadingWhitespace, '');

		let nextLine = lineNumber + 1;
		
		let nexpr = await numExpressions(text)
		if(nexpr === 1) { return text; }

		let expr = ""
		while (nextLine < doc.lineCount) {
			let nextLineText = doc.lineAt(nextLine).text.replace(leadingWhitespace, '');

			text = text + '\n' + nextLineText;
			nextLine++;

			nexpr = await numExpressions(text)
			if(nexpr > 1){ break; } // break if multiple expressions
			if(nexpr === 1){ expr = text; } // save if single expression
		}

		// Remove all empty lines
        expr = expr.replace(/^\s*[\r\n]/gm, '');
        
		// Add an empty line at the end
        expr += '\n';
		
		return expr;
	} catch (error) {
		console.error(error);
		vscode.window.showErrorMessage('An error occurred while processing the Python code.');
		return null;
	}
}


async function pycmd(){
	
	const editor = vscode.window.activeTextEditor;
	const terminal = vscode.window.activeTerminal;
	
	// If there is a selection, send that to the terminal
	if (!editor.selection.isEmpty) {
		terminal.sendText(editor.document.getText(editor.selection) + '\n');
		return;
	}
	
	// Otherwise try to build the expression starting at the active line
	let expr = await pyexpr(editor, terminal);
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
	let cmd = vscode.commands.registerCommand('extension.pycmd', pycmd)
	context.subscriptions.push(cmd);
}

export function deactivate() {
	if (pyProcess) {
        pyProcess.kill();
    }
}
