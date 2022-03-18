'use strict'
import * as vscode from 'vscode'
const fs = require('fs')
const PathModule = require('path')

export function activate(context: vscode.ExtensionContext) {
    // Register the commands that are provided to the user
    var current_renaming

    let disposableRenameCommand = vscode.commands.registerCommand('extension.renameBatch', (clicked_file, selected_files) => {
        if (!selected_files) return
        
        current_renaming = {
            files: []
        }

        selected_files.forEach(file => {
            file.basename = PathModule.basename(file.fsPath)
            file.basepath = file.fsPath.split(file.basename).slice(0, -1).join(file.basename)
            current_renaming.files.push(file)
        })

        let batchFilePath = PathModule.join(__dirname, '.Batch Rename.txt')
        let content = current_renaming.files.map(file => file.basename).join('\n')
        fs.writeFileSync(batchFilePath, content)

        var openPath = vscode.Uri.file(batchFilePath)

        vscode.workspace.openTextDocument(openPath).then(doc => {
            current_renaming.doc = doc
            vscode.window.showTextDocument(doc).then(editor => {
            })

            current_renaming.save = function() {
            
                let new_names = doc.getText().split(/[\r\n]+/).filter(line => !!line);

                if (current_renaming.files.length == new_names.length) {
                    
                    current_renaming.files.forEach((file, i) => {
                        let num = 1;
                        let new_path = file.basepath + new_names[i];
                        if (file.fsPath == new_path) return;

                        while (fs.existsSync(new_path)) {
                            new_path = file.basepath + new_names[i].replace(/\.(?=[A-z0-9]*$)/, `_${num}.`);
                            num++;
                        }

                        fs.renameSync(file.fsPath, new_path)
                    })
                } else {
                    vscode.window.showInformationMessage('The line count does not match the file selection!')
                }
                vscode.commands.executeCommand('workbench.action.closeActiveEditor')
                fs.unlink(batchFilePath, (err) => {
                    if (err) console.error(err);
                })
            }
        })

    })

    vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc == current_renaming.doc) {
            current_renaming.save()
        }
    })
    // push to subscriptions list so that they are disposed automatically
    context.subscriptions.push(disposableRenameCommand)

}


// This method is called when extension is deactivated
export function deactivate() {}
