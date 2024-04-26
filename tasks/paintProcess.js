const notifier = require('node-notifier')
const { mkTask, mkCronTask } = require('../dist/TaskUtil')
const yki = require('../dist/yki')
const { dayKraStats } = require('../dist/neo-kra-stat') 
const { randomIcon } = require('../dist/Constants')

const MILESTONES = [10, 30, 45, 60, 90, 120, 150, 180, 240, 320, 480, 9999999]

module.exports = mkCronTask(
    '本日绘画时间里程碑',
    '* * * * *',
    logger => {
        logger.log('init')
        return {
            lastDisplayedMileStoneIdx: -1, 
        }
    },

    (logger, state) => {
        const dayRecords = dayKraStats()
        const today = Math.floor((dayRecords[yki.dayKey(yki.getBelongDate(new Date()))] ?? 0))
        // logger.log(JSON.stringify(dayRecords))
        logger.log(yki.dayKey(yki.getBelongDate(new Date())))
        const nextMileStoneIdx = MILESTONES.findIndex(mileStone => mileStone > today)

        logger.log(`now: ${today} min, next milestone: ${MILESTONES[nextMileStoneIdx]}`)

        if (nextMileStoneIdx === 0) {
            return [{
                type: 'skip',
                data: ''
            }]
        }
        const lastActivatedMileStoneIdx = nextMileStoneIdx - 1
        if (lastActivatedMileStoneIdx === state.lastDisplayedMileStoneIdx) {
            return [{
                type: 'skip',
                data: ''
            }]
        }

        state.lastDisplayedMileStoneIdx = lastActivatedMileStoneIdx

        const thisMileStone = MILESTONES[state.lastDisplayedMileStoneIdx]
        const nextMileStone = MILESTONES[state.lastDisplayedMileStoneIdx + 1]
        const msg = today - thisMileStone < 5 ? `${thisMileStone} 分钟达成！下一里程碑：${nextMileStone} 分钟` : `当前绘画时间：${today} 分钟，${thisMileStone} 分钟达成！下一里程碑：${nextMileStone} 分钟`
        notifier.notify({
            title: '绘画时间里程碑达成！',
            message: msg,
            icon: randomIcon('well_done')
        })
        
        return [{
            type: 'success', data: `execute at ${new Date().$let(yki.hhMM)}`
        }]
    }
)