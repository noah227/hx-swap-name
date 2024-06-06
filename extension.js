var hx = require("hbuilderx");
const fs = require("fs");
const path = require("path")
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
    fs.renameSync(
        path.resolve(cwd, oldName),
        path.resolve(cwd, newName)
    ) 
}

/**
 * @param {String} basename
 */
const getMainPart = (basename) => {
    // 包含了以.开头命名的文件判定
    if (basename.indexOf(".") <= 0) return basename
    else {
        return basename.split(".").reverse().slice(1).reverse().join(".")
    }
}

const createNewName = (nameMainPart, nameExt) => {
    return nameExt ? nameMainPart + nameExt : nameMainPart
}

const getIfCanSwap = (p1, p2) => new Promise((resolve, reject) => {
    let errMsg = ""
    const errTail = "详见<a href='https://github.com/noah227/hx-swap-name?tab=readme-ov-file#使用限制' style='margin-left: 86px;'>使用限制</a>"
    // 同类交换限定判定
    if(fs.statSync(p1).isDirectory() ^ fs.statSync(p2).isDirectory()) {
        errMsg = "不支持文件夹与文件名称交换！"
    }
    else {
        const n1 = path.basename(p1), n2 = path.basename(p2)
        if(n1.startsWith(".") ^ n2.startsWith(".")) {
            const tagB = "<b style=''>.</b>"
            errMsg = `${tagB} 开头文件只能与 ${tagB} 开头文件的文件进行名称交换！`
        }
    }
    if(errMsg) hx.window.setStatusBarMessage("<strong>条件限制：</strong>" + errMsg + errTail, 8000, "error")
    else resolve(true)
})

const needPrompt = () => {
    return hx.workspace.getConfiguration(require("./package.json").id).get("promptBeforeSwap")
}

//该方法将在插件激活的时候调用
function activate(context) {
    let disposable = hx.commands.registerCommand('extension.swapName', (ctx) => {
        
        const fsPathList = ctx.map(item => item.fsPath)
        const [f1, f2] = fsPathList
        
        hx.window.clearStatusBarMessage()
        getIfCanSwap(f1, f2).then(() => {
            const cwd1 = path.dirname(f1), cwd2 = path.dirname(f2)
            const n1Ext = path.extname(f1), n2Ext = path.extname(f2)
            const n1 = path.basename(f1), n2 = path.basename(f2), n2Temp = uuid.v4()
            const n1Main = getMainPart(n1), n2Main = getMainPart(n2)
            const n1NewName = createNewName(n2Main, n1Ext), n2NewName = createNewName(n1Main, n2Ext)
            const action = () => {
                try {
                    // n2名称释放
                    renameFile(cwd2, n2, n2Temp)
                    // 命名n1为n2
                    renameFile(cwd1, n1, n1NewName)
                    // n2重新命名为n1 
                    renameFile(cwd2, n2Temp, n2NewName)
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
                        <div style="color: transparent">------------------------------------------------</div>
            			<div>是否继续？</div>
            		`,
                    buttons: ["取消", "继续"]
                }).then(button => {
                    if (button === "继续") {
                        action()
                    }
                })
            } else action()
        }) 
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