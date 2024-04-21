const notifier = require('node-notifier')
const { mkTask } = require('../dist/TaskUtil')
const yki = require('../dist/yki')
const { dayKraStats } = require('../dist/neo-kra-stat') 
const { randomIcon } = require('../dist/Constants')
const {app, clipboard} = require('electron')


module.exports = mkTask(
    '剪切板监听',
    logger => {
        logger.log('init')
        logger.log(require('electron'))
        app.on('ready', () => {
        })
        return {
            lastExecuteTime: new Date(),
        }
    },

    (logger, state) => {
        return state.lastExecuteTime.getSeconds() !== new Date().getSeconds()
    },

    (logger, state) => {
        
        logger.log(clipboard)
        const img = clipboard?.readImage()
        logger.log(img)
        // img?.toPNG()
        return [{
            type: 'success', data: 'rrr'
        }, {lastExecuteTime: new Date()}]
    }
)
