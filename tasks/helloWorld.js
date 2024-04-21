const notifier = require('node-notifier')
const { mkTask } = require('../dist/TaskUtil')
const yki = require('../dist/yki')
const { randomIcon } = require('../dist/Constants')

module.exports = mkTask(
    '你好，世界',
    logger => {
        notifier.notify({
            title: '你好，世界！',
            message: 'Scheduler 已启动',
            icon: randomIcon('hello')
        })
        
        return {
            
        }
    },

    (logger, state) => {
        return false
    },

    (logger, state) => {
        throw new Error('Impossible')
    }
)
