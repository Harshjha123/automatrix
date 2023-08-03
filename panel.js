const express = require('express');
const router = express.Router();

const Status = require('./Models/Status.js')
const Withdraw = require('./Models/Withdraw.js')

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

module.exports = router