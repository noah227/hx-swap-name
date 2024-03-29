var hx = require("hbuilderx");
const {
    execSync
} = require("child_process")
const uuid = require("uuid");

/**
 * @param {string} fsPath 文件全路径
 * @param {string} oldName 原始名称
 * @param {string} newName 新名词
 */
const renameFile = (cwd, oldName, newName) => {
    const cmd = `rename ${oldName} ${newName}`
    execSync("chcp 65001")
    execSync(cmd, {
        cwd,
        encoding: "utf8"
    })
}

const getMainPart = (basename) => {
    if (basename.indexOf(".") <= 0) return basename
    else {
        return basename.split(".").reverse().slice(1).join("")
    }
}

const createNewName = (nameMainPart, nameExt) => {
    return nameExt ? nameMainPart + nameExt : nameMainPart
}

const needPrompt = () => {
    return hx.workspace.getConfiguration(require("./package.json").id).get("promptBeforeSwap")
}

//该方法将在插件激活的时候调用
function activate(context) {
    let disposable = hx.commands.registerCommand('extension.swapName', (ctx) => {
        if (ctx.fsPath) hx.window.showInformationMessage("请选择两个文件")
        else if (ctx instanceof Array) {
            if (ctx.length > 2) hx.window.showInformationMessage(`选中的文件数量不规范（需要2个，选中了${ctx.length}个）`)
            else {
                const cwd = ctx[0].workspaceFolder.uri.fsPath
                const path = require("path")
                const fsPathList = ctx.map(item => item.fsPath)
                const [f1, f2] = fsPathList

                const n1Ext = path.extname(f1), n2Ext = path.extname(f2)
                const n1 = path.basename(f1), n2 = path.basename(f2), n2Temp = uuid.v4()
                const n1Main = getMainPart(n1), n2Main = getMainPart(n2)
                const n1NewName = createNewName(n2Main, n1Ext), n2NewName = createNewName(n1Main, n2Ext)
                const action = () => {
                    try {
                        // n2名称释放
                        renameFile(cwd, n2, n2Temp)
                        // 命名n1为n2
                        renameFile(cwd, n1, n1NewName)
                        // n2重新命名为n1 
                        renameFile(cwd, n2Temp, n2NewName)
                    } catch (e) {
                        console.error(e)
                        hx.window.showErrorMessage(e?.message || "未知错误，请重试")
                    }
                }
                if (needPrompt()) {
                    hx.window.showMessageBox({
                        title: "操作确认",
                        text: `
							<div>${n1} -> ${n1NewName}</div>
							<div>${n2} -> ${n2NewName}</div>
							<div>是否继续？</div>
						`,
                        buttons: ["取消", "继续"]
                    }).then(button => {
                        if (button === "继续") {
                            action()
                        }
                    })
                } else action()
            }
        }
    });
    //订阅销毁钩子，插件禁用的时候，自动注销该command。
    context.subscriptions.push(disposable);
}
//该方法将在插件禁用的时候调用（目前是在插件卸载的时候触发）
function deactivate() {

}
module.exports = {
    activate,
    deactivate
}