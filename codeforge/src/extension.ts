import * as vscode from 'vscode';
import * as https from 'https';

// Simple OpenAI client using native https
async function callOpenAI(apiKey: string, model: string, messages: any[], temperature: number = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model,
            messages,
            temperature
        });

        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    if (parsed.error) {
                        reject(parsed.error.message);
                    } else {
                        resolve(parsed.choices[0]?.message?.content || '');
                    }
                } catch (e) {
                    reject('Failed to parse response');
                }
            });
        });

        req.on('error', (error) => {
            reject(error.message);
        });

        req.write(data);
        req.end();
    });
}

// CodeForge Extension
export function activate(context: vscode.ExtensionContext) {
    console.log('CodeForge is now active!');

    const config = vscode.workspace.getConfiguration('codeforge');

    // Generate Code Command
    const generateCodeCmd = vscode.commands.registerCommand('codeforge.generateCode', async () => {
        const apiKey = config.get<string>('apiKey') || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            vscode.window.showErrorMessage('Please set your OpenAI API key in CodeForge settings');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const prompt = await vscode.window.showInputBox({
            prompt: 'Describe what code you want to generate',
            placeHolder: 'e.g., Create a function to sort an array of objects by date'
        });

        if (!prompt) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating code...',
            cancellable: false
        }, async () => {
            try {
                const response = await callOpenAI(
                    apiKey,
                    config.get<string>('model') || 'gpt-3.5-turbo',
                    [
                        {
                            role: 'system',
                            content: 'You are a helpful coding assistant. Generate clean, well-documented code. Only return the code, no explanations.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    0.7
                );

                // Insert code at cursor position
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.start, response);
                });

                vscode.window.showInformationMessage('Code generated successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Explain Code Command
    const explainCodeCmd = vscode.commands.registerCommand('codeforge.explainCode', async () => {
        const apiKey = config.get<string>('apiKey') || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            vscode.window.showErrorMessage('Please set your OpenAI API key in CodeForge settings');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to explain');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Analyzing code...',
            cancellable: false
        }, async () => {
            try {
                const response = await callOpenAI(
                    apiKey,
                    config.get<string>('model') || 'gpt-3.5-turbo',
                    [
                        {
                            role: 'system',
                            content: 'You are a helpful coding assistant. Explain code in a clear and concise way.'
                        },
                        {
                            role: 'user',
                            content: `Explain this code:\n\n${selectedText}`
                        }
                    ],
                    0.5
                );

                // Show explanation in output channel
                const outputChannel = vscode.window.createOutputChannel('CodeForge Explanation');
                outputChannel.clear();
                outputChannel.appendLine('=== Code Explanation ===');
                outputChannel.appendLine('');
                outputChannel.appendLine(selectedText);
                outputChannel.appendLine('');
                outputChannel.appendLine('=== Explanation ===');
                outputChannel.appendLine(response);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Review Code Command
    const reviewCodeCmd = vscode.commands.registerCommand('codeforge.reviewCode', async () => {
        const apiKey = config.get<string>('apiKey') || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            vscode.window.showErrorMessage('Please set your OpenAI API key in CodeForge settings');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to review');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Reviewing code...',
            cancellable: false
        }, async () => {
            try {
                const response = await callOpenAI(
                    apiKey,
                    config.get<string>('model') || 'gpt-3.5-turbo',
                    [
                        {
                            role: 'system',
                            content: 'You are a code reviewer. Identify potential bugs, performance issues, and suggest improvements. Be concise and actionable.'
                        },
                        {
                            role: 'user',
                            content: `Review this code:\n\n${selectedText}`
                        }
                    ],
                    0.3
                );

                // Show review in output channel
                const outputChannel = vscode.window.createOutputChannel('CodeForge Review');
                outputChannel.clear();
                outputChannel.appendLine('=== Code Review ===');
                outputChannel.appendLine('');
                outputChannel.appendLine(response);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Refactor Code Command
    const refactorCodeCmd = vscode.commands.registerCommand('codeforge.refactorCode', async () => {
        const apiKey = config.get<string>('apiKey') || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            vscode.window.showErrorMessage('Please set your OpenAI API key in CodeForge settings');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to refactor');
            return;
        }

        const refactorType = await vscode.window.showQuickPick([
            { label: 'Improve readability', value: 'readability' },
            { label: 'Optimize performance', value: 'performance' },
            { label: 'Add error handling', value: 'error-handling' }
        ], {
            placeHolder: 'Select refactoring type'
        });

        if (!refactorType) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Refactoring code...',
            cancellable: false
        }, async () => {
            try {
                const response = await callOpenAI(
                    apiKey,
                    config.get<string>('model') || 'gpt-3.5-turbo',
                    [
                        {
                            role: 'system',
                            content: `You are a code refactoring expert. Refactor code for ${refactorType.value}. Only return the refactored code, no explanations.`
                        },
                        {
                            role: 'user',
                            content: `Refactor this code:\n\n${selectedText}`
                        }
                    ],
                    0.4
                );

                // Show refactored code in new editor
                const doc = await vscode.workspace.openTextDocument({
                    content: response,
                    language: editor.document.languageId
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Add commands to subscriptions
    context.subscriptions.push(generateCodeCmd);
    context.subscriptions.push(explainCodeCmd);
    context.subscriptions.push(reviewCodeCmd);
    context.subscriptions.push(refactorCodeCmd);

    vscode.window.showInformationMessage('CodeForge is ready! Use Ctrl+Shift+G to generate code.');
}

export function deactivate() {
    console.log('CodeForge is now deactivated');
}