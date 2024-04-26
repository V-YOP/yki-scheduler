import { execSync } from "child_process";
import { notify } from "node-notifier";

type Theme = 'light' | 'dark'

export function getTheme(): Theme {
    const res = execSync(`powershell -Command 
    "Get-ItemPropertyValue 
    -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' 
    -Name AppsUseLightTheme"`.replace(/\r?\n/g, ' '), {windowsHide: true, }).toString('utf-8').trim()
    return res === '1' ? 'light' : 'dark'
}

export function setTheme(theme: Theme) {
    const v = theme === 'light' ? 1 : 0
    execSync(`powershell -Command 
    "Set-ItemProperty 
    -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' 
    -Name AppsUseLightTheme -Value ${v}; 
    Set-ItemProperty 
    -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' 
    -Name SystemUsesLightTheme 
    -Value ${v}"`.replace(/\r?\n/g, ' '), {windowsHide: true, })
}

let lastTheme = getTheme()
export function toggleTheme() {
    if (lastTheme === 'dark') {
        lastTheme = 'light'
    } else {
        lastTheme = 'dark'
    }
    setTheme(lastTheme)
    notify({
        title: 'Theme changed',
        message: `set theme to ${lastTheme}`
    })
}