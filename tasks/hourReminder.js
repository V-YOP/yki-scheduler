const notifier = require('node-notifier')
const { mkTask, mkCronTask } = require('../dist/TaskUtil')
const yki = require('../dist/yki')
const { dayKraStats } = require('../dist/neo-kra-stat') 
const { randomIcon } = require('../dist/Constants')

function threshold(msgThresholdArr) {
    return value => {
        return msgThresholdArr.reverse().find(([msg, threshold]) => value >= threshold)[0]
    }
}

function msg(todaySum, nowHour) {
    return '活动一下！休息一下眼睛！'
    // if (nowHour === 0) {
    //     return `本日绘画时间：${todaySum} 分钟，` + threshold(
    //         [['丫的没画？', 0],
    //         ['待改善', 30],
    //         ['稍微画了点', 60],
    //         ['再加把劲！', 90],
    //         ['打卡成功！！', 120],
    //         ['牛逼！', 180]]
    //     )(todaySum)
    // }
    // return todaySum === 0 ? `当前还未动笔` : `当前绘画时间：${todaySum} 分钟`
}

const MSG = {
    0: threshold(
        [['丫的没画？', 0],
        ['稍微动了点...', 30],
        ['还算及格吧', 60],
        ['再接再厉！', 90],
        ['牛逼！', 120],
        ['光荣下播！', 180]]
    ),
    1: () => '修仙呢！？',
    2: () => '修仙呢！？',
    3: () => '修仙呢！？',
    4: () => '修仙呢！？',
    5: () => '修仙呢！？',
    6: () => '起了，还是没睡？',
    7: () => '起了，还是没睡？',
    20: () => '回家了吗？画了吗？',
    21: () => '画了吗？',
    22: () => '画了吗？',
    23: () => '画了吗？',
}

module.exports = mkCronTask(
    '准点横幅提醒',
    '0,30 * * * *',
    logger => {
        logger.log('init')
        return {}
    },
    (logger, state) => {
        const dayRecords = dayKraStats()
        const today = Math.floor((dayRecords[yki.dayKey(yki.getBelongDate(new Date()))] ?? 0))

        if (new Date().getHours() >= 1 && new Date().getHours() <= 6) {
            notifier.notify({
                title: '滚去睡觉！',
                message: `${msg(today, new Date().getHours())}，但该去睡觉了`,
                icon: randomIcon('happy')
            })
        } else {
            notifier.notify({
                title: '准点报时！',
                message: `${new Date().$let(yki.hhMM)} 了！${msg(today, new Date().getHours())}`,
                icon: randomIcon('happy')
            })
        }
        return [{
            type: 'success', data: `execute at ${new Date().$let(yki.hhMM)}`
        }, {}]
    }
)
