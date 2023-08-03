const express = require('express');
const router = express.Router();

const Status = require('./Models/Status.js')
const Withdraw = require('./Models/Withdraw.js');
const User = require('./Models/User.js')
const Balance = require('./Models/Balance.js')
const Recharge = require('./Models/Recharge.js')
const Referral = require('./Models/Referral.js');
const Invest = require('./Models/Invest.js');

let defaultId = '9cbe16a0-d238-4212-907e-ebfe7cb94db4';

router.post('/data', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).send({ error: 'Failed to receive token' })

        let status = await Status.findOne({ id: defaultId })
        if (!status) return res.status(200).send({ users: 0, investments: 0, withdrawal: 0, recharge: 0, daily: 0, pending: [] })

        let pending = await Withdraw.find({ status: 'Pending'})
        return res.status(200).send({ users: status.users, investments: status.investments, withdrawal: status.withdrawals, recharge: status.deposits, daily: status.daily, pending })
    } catch (error) {
        console.log('/panel/data error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data'})
    }
})

router.post('/pending/withdrawals', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).send({ error: 'Failed to receive token' })

        let users = await Withdraw.find({ status: 'Pending' })
        return res.status(200).send({ records: users[0] ? users : [] })
    } catch (error) {
        console.log('/panel/pending/withdrawals error: ', error);
        return res.status(400).send({ error: 'Failed to fetch data' })
    }
})


router.post('/users/data', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).send({ success: false, error: 'Failed to receive token' })

        let users = await User.find().sort({ _id: -1 }).limit(100)
        return res.status(200).send({ success: true, records: users[0] ? users : [] })
    } catch (error) {
        console.log('/panel/users/data error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})

router.post('/withdrawals/data', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).send({ success: false, error: 'Failed to receive token' })

        let users = await Withdraw.find({ status: 'Success' }).sort({ _id: -1 }).limit(100)
        let status = await Status.findOne({ id: defaultId })
        let amount = status.withdrawals

        return res.status(200).send({ success: true, amount, records: users[0] ? users : [] })
    } catch (error) {
        console.log('/panel/withdrawal/data error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})

router.post('/recharge/data', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).send({ success: false, error: 'Failed to receive token' })

        let users = await Recharge.find({ status: 'Success' }).sort({ _id: -1 }).limit(100)
        let status = await Status.findOne({ id: defaultId })
        let amount = status.deposits

        return res.status(200).send({ success: true, amount, records: users[0] ? users : [] })
    } catch (error) {
        console.log('/panel/recharge/data error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})


router.post('/user/data', async (req, res) => {
    try {
        const { token, id } = req.body;
        if (!token) return res.status(400).send({ success: false, error: 'Failed to receive token' })

        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ success: false, error: 'No account exist' })
        if (!getUser.admin) return res.status(400).send({ success: false, error: 'You are not admin' })

        let user = await User.findOne({ id })
        if (!user) return res.status(400).send({ success: false, error: 'Id not exist' })

        let balance = await Balance.findOne({ id })
        let referral = await Referral.findOne({ id })
        let recharge = await Recharge.find({ id }).sort({ _id: -1 }).limit(10)
        let withdrawal = await Withdraw.find({ id }).sort({ _id: -1 }).limit(10)
        let products = await Invest.find({ id }).sort({ _id: -1 })

        return res.status(200).send({ success: true, recharge, withdrawal, products, referral: { lv1: { income: referral.income.lv1, record: referral.lv1_records }, lv2: { income: referral.income.lv2, record: referral.lv2_records }, lv3: { income: referral.income.lv3, record: referral.lv3_records } }, balance: { deposit: balance.deposit, withdraw: balance.withdraw, referral: balance.referral, product: balance.product }, user: { phone: `${user.country_code} ${user.phone}`, email: user.email, password: user.password, status: user.status, referrer: user.lv1, password: user.password } })
    } catch (error) {
        console.log('/panel/pending/withdrawals error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})

//ban & unban user
router.post('/change/user/status', async (req, res) => {
    try {
        const { token, id } = req.body;
        if (!token) return res.status(400).send({ success: false, error: 'Failed to receive token' })

        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ success: false, error: 'No account exist' })
        if (!getUser.admin) return res.status(400).send({ success: false, error: 'You are not admin' })

        let user = await User.findOne({ id })
        if (!user) return res.status(400).send({ success: false, error: 'Id not exist' })

        user.status = !user.status
        await user.save()

        return res.status(200).send({ success: true, status: user.status })
    } catch (error) {
        console.log('/change/user/status error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})

//change user balance
router.post('/change/user/balance', async (req, res) => {
    try {
        const { token, reset, add, type, amount } = req.body;
        if (!token) return res.status(400).send({ success: false, error: 'Failed to receive token' })

        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ success: false, error: 'No account exist' })
        if (!getUser.admin) return res.status(400).send({ success: false, error: 'You are not admin' })

        let user = await User.findOne({ id })
        if (!user) return res.status(400).send({ success: false, error: 'Id not exist' })

        let balance = await Balance.findOne({ id })
        if (reset) {
            if (type) {
                balance.withdraw = 0
            } else {
                balance.deposit = 0
            }
        } else {
            if (type) {
                if (add) {
                    balance.withdraw += parseFloat(amount)
                } else {
                    balance.withdraw -= parseFloat(amount)
                }
            } else {
                if (add) {
                    balance.deposit += parseFloat(amount)
                } else {
                    balance.deposit -= parseFloat(amount)
                }
            }
        }

        await balance.save()
        return res.status(200).send({ [type ? 'withdraw' : 'deposit']: type ? balance.withdraw : balance.deposit })
    } catch (error) {
        console.log('/change/user/balance error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})

module.exports = router