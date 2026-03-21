import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG_SECTION = 'codeforge';
const CACHE_DIR = path.join(__dirname, '..', '.cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Usage statistics
interface UsageStats {
    totalRequests: number;
    totalTokens: number;
    lastUsed: string;
    commands: { [key: string]: number };
}

function loadStats(): UsageStats {
    try {
        const statsPath = path.join(CACHE_DIR, 'stats.json');
        if (fs.existsSync(statsPath)) {
            return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
    return {
        totalRequests: 0,
        totalTokens: 0,
        lastUsed: new Date().toISOString(),
        commands: {}
    };
}

function saveStats(stats: UsageStats) {
    try {
        const statsPath = path.join(CACHE_DIR, 'stats.json');
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error('Failed to save stats:', e);
    }
}

function updateStats(command: string, tokens: number = 0) {
    const stats = loadStats();
    stats.totalRequests++;
    stats.totalTokens += tokens;
    stats.lastUsed = new Date().toISOString();
    stats.commands[command] = (stats.commands[command] || 0) + 1;
    saveStats(stats);
}

// Validate API Key format
function isValidApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-') && apiKey.length > 20;
}

// OpenAI client with retry logic
async function callOpenAI(
    apiKey: string, 
    model: string, 
    messages: any[], 
    temperature: number = 0.7,
    maxRetries: number = 3
): Promise<{ content: string; tokens: number }> {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const tryRequest = () => {
            attempts++;
            
            const data = JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: 2000
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
                },
                timeout: 30000 // 30 second timeout
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
                            if (attempts < maxRetries && res.statusCode === 429) {
                                // Rate limit, retry after delay
                                setTimeout(tryRequest, 1000 * attempts);
                                return;
                            }
                            reject(parsed.error.message || 'API Error');
                            return;
                        }
                        
                        const content = parsed.choices[0]?.message?.content || '';
                        const tokens = parsed.usage?.total_tokens || 0;
                        resolve({ content, tokens });
                    } catch (e) {
                        reject('Failed to parse API response');
                    }
                });
            });

            req.on('error', (error) => {
                if (attempts < maxRetries) {
                    setTimeout(tryRequest, 1000 * attempts);
                } else {
                    reject(`Request failed: ${error.message}`);
                }
            });

            req.on('timeout', () => {
                req.destroy();
                if (attempts < maxRetries) {
                    setTimeout(tryRequest, 1000 * attempts);
                } else {
                    reject('Request timeout');
                }
            });

            req.write(data);
            req.end();
        };
        
        tryRequest();
    });
}

// Cache responses
function getCacheKey(messages: any[]): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(messages)).digest('hex');
}

function getCachedResponse(key: string): string | null {
    try {
        const cachePath = path.join(CACHE_DIR, `${key}.json`);
        if (fs.existsSync(cachePath)) {
            const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            // Cache valid for 1 hour
            if (Date.now() - data.timestamp < 3600000) {
                return data.content;
            }
        }
    } catch (e) {
        console.error('Cache read error:', e);
    }
    return null;
}

function setCachedResponse(key: string, content: string) {
    try {
        const cachePath = path.join(CACHE_DIR, `${key}.json`);
        fs.writeFileSync(cachePath, JSON.stringify({
            content,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Cache write error:', e);
    }
}

// CodeForge Extension
export function activate(context: vscode.ExtensionContext) {
    console.log('CodeForge is now active!');

    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const stats = loadStats();
    
    // Show welcome message with stats
    vscode.window.showInformationMessage(
        `CodeForge ready! You've used ${stats.totalRequests} requests.`,
        'View Stats'
    ).then(selection => {
        if (selection === 'View Stats') {
            showStats();
        }
    });

    // Validate API Key before each command
    async function validateApiKey(): Promise<string | null> {
        const apiKey = config.get<string>('apiKey') || process.env.OPENAI_API_KEY || '';
        
        if (!apiKey) {
            const action = await vscode.window.showErrorMessage(
                'OpenAI API Key not configured',
                'Configure Now',
                'Get API Key'
            );
            
            if (action === 'Configure Now') {
                vscode.commands.executeCommand('workbench.action.openSettings', CONFIG_SECTION);
            } else if (action === 'Get API Key') {
                vscode.env.openExternal(vscode.Uri.parse('https://platform.openai.com/api-keys'));
            }
            return null;
        }
        
        if (!isValidApiKey(apiKey)) {
            vscode.window.showErrorMessage('Invalid API Key format. Should start with "sk-"');
            return null;
        }
        
        return apiKey;
    }

    // Show stats command
    async function showStats() {
        const stats = loadStats();
        const panel = vscode.window.createWebviewPanel(
            'codeforgeStats',
            'CodeForge Statistics',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .stat-card {
                        background: #f5f5f5;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 10px 0;
                    }
                    .stat-value {
                        font-size: 32px;
                        font-weight: bold;
                        color: #0066cc;
                    }
                    .stat-label {
                        color: #666;
                        margin-top: 5px;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                    }
                </style>
            </head>
            <body>
                <h1>📊 CodeForge Statistics</h1>
                <div class="grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalRequests}</div>
                        <div class="stat-label">Total Requests</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalTokens.toLocaleString()}</div>
                        <div class="stat-label">Total Tokens</div>
                    </div>
                </div>
                <h2>Command Usage</h2>
                ${Object.entries(stats.commands).map(([cmd, count]) => `
                    <div class="stat-card">
                        <div class="stat-value">${count}</div>
                        <div class="stat-label">${cmd}</div>
                    </div>
                `).join('')}
                <p style="margin-top: 30px; color: #999;">
                    Last used: ${new Date(stats.lastUsed).toLocaleString()}
                </p>
            </body>
            </html>
        `;
    }

    // Generate Code Command
    const generateCodeCmd = vscode.commands.registerCommand('codeforge.generateCode', async () => {
        const apiKey = await validateApiKey();
        if (!apiKey) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const prompt = await vscode.window.showInputBox({
            prompt: 'Describe what code you want to generate',
            placeHolder: 'e.g., Create a function to sort an array of objects by date',
            validateInput: (value) => {
                if (!value || value.trim().length < 3) {
                    return 'Please enter a more detailed description';
                }
                return null;
            }
        });

        if (!prompt) return;

        const model = config.get<string>('model') || 'gpt-3.5-turbo';
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful coding assistant. Generate clean, well-documented code. Only return the code, no explanations.'
            },
            { role: 'user', content: prompt }
        ];

        // Check cache
        const cacheKey = getCacheKey(messages);
        const cached = getCachedResponse(cacheKey);
        
        if (cached) {
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.start, cached);
            });
            vscode.window.showInformationMessage('Code inserted from cache');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating code...',
            cancellable: true
        }, async (progress, token) => {
            try {
                const { content, tokens } = await callOpenAI(apiKey, model, messages, 0.7);
                
                if (token.isCancellationRequested) return;
                
                // Cache the response
                setCachedResponse(cacheKey, content);
                
                // Update stats
                updateStats('generateCode', tokens);
                
                // Insert code
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.start, content);
                });

                vscode.window.showInformationMessage(`Code generated! (${tokens} tokens)`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Explain Code Command
    const explainCodeCmd = vscode.commands.registerCommand('codeforge.explainCode', async () => {
        const apiKey = await validateApiKey();
        if (!apiKey) return;

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

        if (selectedText.length > 5000) {
            vscode.window.showWarningMessage('Selected code is too long. Explaining first 5000 characters.');
        }

        const model = config.get<string>('model') || 'gpt-3.5-turbo';
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful coding assistant. Explain code in a clear and concise way.'
            },
            { role: 'user', content: `Explain this code:\n\n${selectedText.slice(0, 5000)}` }
        ];

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Analyzing code...',
            cancellable: true
        }, async (progress, token) => {
            try {
                const { content, tokens } = await callOpenAI(apiKey, model, messages, 0.5);
                
                if (token.isCancellationRequested) return;
                
                updateStats('explainCode', tokens);
                
                const outputChannel = vscode.window.createOutputChannel('CodeForge Explanation');
                outputChannel.clear();
                outputChannel.appendLine('=== Code Explanation ===');
                outputChannel.appendLine('');
                outputChannel.appendLine(selectedText.slice(0, 200) + '...');
                outputChannel.appendLine('');
                outputChannel.appendLine('=== Explanation ===');
                outputChannel.appendLine(content);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Review Code Command
    const reviewCodeCmd = vscode.commands.registerCommand('codeforge.reviewCode', async () => {
        const apiKey = await validateApiKey();
        if (!apiKey) return;

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

        const model = config.get<string>('model') || 'gpt-3.5-turbo';
        const messages = [
            {
                role: 'system',
                content: 'You are a code reviewer. Identify potential bugs, performance issues, and suggest improvements. Be concise and actionable.'
            },
            { role: 'user', content: `Review this code:\n\n${selectedText.slice(0, 5000)}` }
        ];

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Reviewing code...',
            cancellable: true
        }, async (progress, token) => {
            try {
                const { content, tokens } = await callOpenAI(apiKey, model, messages, 0.3);
                
                if (token.isCancellationRequested) return;
                
                updateStats('reviewCode', tokens);
                
                const outputChannel = vscode.window.createOutputChannel('CodeForge Review');
                outputChannel.clear();
                outputChannel.appendLine('=== Code Review ===');
                outputChannel.appendLine('');
                outputChannel.appendLine(content);
                outputChannel.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // Refactor Code Command
    const refactorCodeCmd = vscode.commands.registerCommand('codeforge.refactorCode', async () => {
        const apiKey = await validateApiKey();
        if (!apiKey) return;

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
            { label: '$(zap) Improve readability', value: 'readability' },
            { label: '$(rocket) Optimize performance', value: 'performance' },
            { label: '$(shield) Add error handling', value: 'error-handling' },
            { label: '$(symbol-color) Modernize syntax', value: 'modernize' }
        ], {
            placeHolder: 'Select refactoring type'
        });

        if (!refactorType) return;

        const model = config.get<string>('model') || 'gpt-3.5-turbo';
        const messages = [
            {
                role: 'system',
                content: `You are a code refactoring expert. Refactor code for ${refactorType.value}. Only return the refactored code, no explanations.`
            },
            { role: 'user', content: `Refactor this code:\n\n${selectedText.slice(0, 5000)}` }
        ];

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Refactoring code...',
            cancellable: true
        }, async (progress, token) => {
            try {
                const { content, tokens } = await callOpenAI(apiKey, model, messages, 0.4);
                
                if (token.isCancellationRequested) return;
                
                updateStats('refactorCode', tokens);
                
                const doc = await vscode.workspace.openTextDocument({
                    content,
                    language: editor.document.languageId
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            } catch (error) {
                vscode.window.showErrorMessage(`Error: ${error}`);
            }
        });
    });

    // View Stats Command
    const viewStatsCmd = vscode.commands.registerCommand('codeforge.viewStats', showStats);

    // Register all commands
    context.subscriptions.push(generateCodeCmd);
    context.subscriptions.push(explainCodeCmd);
    context.subscriptions.push(reviewCodeCmd);
    context.subscriptions.push(refactorCodeCmd);
    context.subscriptions.push(viewStatsCmd);

    console.log('CodeForge commands registered');
}

export function deactivate() {
    console.log('CodeForge is now deactivated');
}