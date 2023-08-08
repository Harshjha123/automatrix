const express = require('express');
const router = express.Router();

const { limiter } = require('./app.js')

const Status = require('./Models/Status.js')
const Withdraw = require('./Models/Withdraw.js');
const User = require('./Models/User.js')
const Balance = require('./Models/Balance.js')
const Recharge = require('./Models/Recharge.js')
const Referral = require('./Models/Referral.js');
const Invest = require('./Models/Invest.js');
const Hexes = require('./Models/Investments.js')
const crypto = require("crypto");

let defaultId = '9cbe16a0-d238-4212-907e-ebfe7cb94db4';

const products = [
    {
        name: 'Mechatron',
        income: 0.16,
        cost: 5,
        period: 25,
        image: 'https://cdna.artstation.com/p/assets/images/images/029/800/282/20200828231051/smaller_square/jarlan-perez-mohs-31-print-web.jpg?1598674251'
    },
    {
        name: 'Nanotron',
        income: 0.1819,
        cost: 18,
        period: 22,
        image: 'https://cdnb.artstation.com/p/assets/images/images/029/517/735/20200818213315/smaller_square/jarlan-perez-mohs-39-print-web.jpg?1597804395'
    },
    {
        name: 'Cybertron',
        income: 0.2,
        cost: 60,
        period: 15,
        image: 'https://cdna.artstation.com/p/assets/images/images/029/800/232/20200828230614/smaller_square/jarlan-perez-mohs-27-v2-print-web.jpg?1598673975'
    },
    {
        name: 'Synthron',
        income: 0.21,
        cost: 135,
        period: 15,
        image: 'https://cdnb.artstation.com/p/assets/images/images/029/572/389/20200820194653/smaller_square/jarlan-perez-mohs-21-print-web.jpg?1597970813'
    },
    {
        name: 'Sparktron',
        income: 0.215,
        cost: 220,
        period: 12,
        image: 'https://cdna.artstation.com/p/assets/images/images/029/617/064/20200822123955/smaller_square/jarlan-perez-mohs-44-print-web-soft.jpg?1598117995'
    },
    {
        name: 'Automatron',
        income: 0.22,
        cost: 350,
        period: 10,
        image: 'https://cdnb.artstation.com/p/assets/images/images/029/491/511/20200817234803/smaller_square/jarlan-perez-mohs-50-print-web.jpg?1597726083'
    },
    {
        name: 'Dynatron',
        income: 0.225,
        cost: 500,
        period: 8,
        image: 'https://cdnb.artstation.com/p/assets/images/images/030/655/713/20200928003128/smaller_square/jarlan-perez-mohs-52-print-web.jpg?1601271088'
    },
    {
        name: 'Voltatron',
        income: 0.23,
        cost: 850,
        period: 7,
        image: 'https://cdna.artstation.com/p/assets/images/images/022/925/690/20191225143755/smaller_square/jarlan-perez-asset.jpg?1577306276'
    },
    {
        name: 'Circuitron',
        income: 0.235,
        cost: 1200,
        period: 7,
        image: 'https://cdnb.artstation.com/p/assets/images/images/011/153/103/20180604095533/smaller_square/jarlan-perez-mohs-32-color.jpg?1528124133'
    },
    {
        name: 'Blitztron',
        income: 0.275,
        cost: 2500,
        period: 5,
        image: 'https://cdnb.artstation.com/p/assets/images/images/030/655/539/20200928002008/smaller_square/jarlan-perez-mohs-28-print-web.jpg?1601270408'
    }
]

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

        let users = await Withdraw.find({ status: 'Pending' }).limit(30)
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
        const { id, passcode } = req.body;

        if (!passcode || passcode !== 'Zzxc@#123') return res.status(400).send({ success: false, error: 'You are not admin' })

        let user = await User.findOne({ id })
        if (!user) return res.status(400).send({ success: false, error: 'Id not exist' })

        let balance = await Balance.findOne({ id })

        return res.status(200).send({ success: true, balance })
    } catch (error) {
        console.log('/panel/pending/withdrawals error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to fetch data' })
    }
})

//ban & unban user
router.post('/change/user/status', limiter, async (req, res) => {
    try {
        const { id, passcode } = req.body;

        if (!passcode || passcode !== 'Zzxc@#123') return res.status(400).send({ success: false, error: 'You are not admin' })

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
router.post('/change/user/balance', limiter, async (req, res) => {
    try {
        const { passcode, reset, add, type, amount, id } = req.body;

        if (!passcode || passcode !== 'Zzxc@#123') return res.status(400).send({ success: false, error: 'You are not admin' })

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

router.post('/add/product', limiter, async (req, res) => {
    const { index, id, passcode } = req.body;
    const plan = products[parseFloat(index)]

    if (!plan) return res.status(400).send({ success: false, error: 'Plan not found' })

    try {
        let getUser = await User.findOne({ id })
        if (!getUser) return res.status(400).send({ success: false, error: 'Id not exist' })

        if (!passcode || passcode !== 'Zzxc@#123') return res.status(400).send({ success: false, error: 'You are not admin' })

        const { cost, name, image, period, income } = plan;

        const hex = crypto.randomBytes(64).toString('hex');

        let record = new Invest({
            id: getUser.id,
            name,
            exp: Date.now() + (1000 * 60 * 60 * 24 * period),
            image,
            daily: income,
            total: 0,
            hex
        })

        record.save()

        let fi = await Hexes.findOne({ id: defaultId })

        if (!fi) {
            let dat = new Hexes({
                id: defaultId,
                hex: [hex]
            })

            await dat.save()
        } else {
            await Hexes.findOneAndUpdate({ id: defaultId }, {
                $push: {
                    hex
                }
            })
        }

        return res.sendStatus(200)

    } catch (error) {
        console.log('/add/user/product error: ', error);
        return res.status(400).send({ success: false, error: 'Failed to add product' })
    }
})

module.exports = router