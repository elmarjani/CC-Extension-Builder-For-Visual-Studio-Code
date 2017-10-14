// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var spawn = require('child_process');
var path = require('path');
var userdir = require('userdir');
var fs = require('fs');

var sdkFolderName = "/CC-EXT-SDK/";
var isWin = true;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('The CC Extension Builder Extension has been activated.');

    isWin = (process.platform != "darwin");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.enableDebugMode', function () {
        // The code you place here will be executed every time your command is executed

        var cmd = "";
        if (isWin) {
            console.log('Enabling Debug Mode on Windows')
            cmd = spawn.spawn('cmd.exe', path.join(__dirname, sdkFolderName, "setdebugmode.bat"));
        } else {
            console.log('Enabling Debug Mode on Mac')
            cmd = spawn.execFile(path.join(__dirname, sdkFolderName, "setdebugmode.sh"));
        }

        cmd.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        cmd.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        cmd.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        // Display a message box to the user
        vscode.window.showInformationMessage('Debug Mode ON');
    });

    var disposable = vscode.commands.registerCommand('extension.createExtension', function () {

        var extId = "";
        var extName = "";
        var cmd;

        getExtensionID();

        function getExtensionID() {

            vscode.window.showInputBox({
                prompt: 'Extension ID, for example com.example.helloworld',
                value: 'com.example.helloworld'
            }).then(function (value) {
                extId = value;
                getExtensionName();
            })
        }

        function getExtensionName() {
            vscode.window.showInputBox({
                prompt: 'Extension Name',
                value: 'Extension Name'
            }).then(function (value) {
                extName = value;
                if (isWin) {
                    console.log('Creating a new CC Extension at %programfiles%/Common\ Files/Adobe/CEP/extensions/' + extId)
                    cmd = spawn.execFile(path.join(__dirname, sdkFolderName, "createext.bat"), ['default', extId]);
                } else {
                    console.log('Creating a new CC Extension at' + userdir + '/Library/Application\ Support/Adobe/CEP/extensions/' + extId)
                    cmd = spawn.execFile(path.join(__dirname, sdkFolderName, "createext.sh"), ['default', extId]);
                }

                cmd.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });

                cmd.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                });

                cmd.on('close', (code) => {
                    console.log(`child process exited with code ${code}`);
                    createExtension();
                });
            })
        }

        function createExtension() {
            if (isWin) {
                var manifestFile = path.join('%programfiles%/Common\ Files/Adobe/CEP/extensions/', extId, '/CSXS/manifest.xml');
                var debugFile = path.join('%programfiles%/Common\ Files/Adobe/CEP/extensions/', extId, '/.debug');
                editTemplate();
                console.log('Processing Template...')
            } else {
                var manifestFile = path.join(userdir, '/Library/Application\ Support/Adobe/CEP/extensions/', extId, '/CSXS/manifest.xml');
                var debugFile = path.join(userdir, '/Library/Application\ Support/Adobe/CEP/extensions/', extId, '/.debug');
                editTemplate();
                console.log('Processing Template...')
            }

            function editTemplate() {
                editTemplate(manifestFile);
                editTemplate(debugFile);

                function editTemplate(srcFile) {
                    var rawText = fs.readFileSync(srcFile).toString();
                    var newText = processTemplate(rawText);
                    fs.writeFileSync(srcFile, newText)
                }

                function processTemplate(manifestString) {
                    var str = manifestString;
                    var reg1 = new RegExp("com.example.ext", "g");
                    str = str.replace(reg1, extId);
                    var reg2 = new RegExp("Extension-Name", "g");
                    str = str.replace(reg2, extName);
                    openExt();
                    return str;
                }
            }
        }

        function openExt() {
            if (isWin) {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file('%programfiles%/Common\ Files/Adobe/CEP/extensions/' + extId), true);
                vscode.window.showInformationMessage('Extension Created');
            } else {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(userdir + '/Library/Application\ Support/Adobe/CEP/extensions/' + extId), true);
                vscode.window.showInformationMessage('Extension Created');
            }
        }
    });
    context.subscriptions.push(disposable);
};

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;