const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    lv1: {
        type: Array,
        default: []
    },
    lv2: {
        type: Array,
        default: []
    },
    lv3: {
        type: Array,
        default: []
    },
    income: {
        lv1: {
            type: Number,
            default: 0
        },
        lv2: {
            type: Number,
            default: 0
        },
        lv3: {
            type: Number,
            default: 0
        }
    }
})

module.exports = mongoose.model('referral', schema)