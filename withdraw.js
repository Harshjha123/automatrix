const axios = require('axios');
const express = require('express');
const router = express.Router();
const TronWeb = require('tronweb');

const Withdraw = require('./Models/Withdraw.js')
const User = require('./Models/User.js')
const Balance = require('./Models/Balance.js');
const Status = require('./Models/Status.js')
const Financial = require('./Models/Financial.js');

const { bot } = require('./app.js')

let defaultId = '9cbe16a0-d238-4212-907e-ebfe7cb94db4'

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io', // Replace with your desired full node URL
});

const wallet = {
    privateKey: 'F8846D74D5E6C3A80A0BA32124BFEA6B53EE3CE6CAAD5F14F48C497A31005235',
    address: 'TGymMQxr5oHr1i5gSwCc8iGBX6fdezSXk7'
}

bot.start((ctx) => {
    if(ctx.message.from.id.toString() === '5912074585') {
        ctx.reply('Welcome to iBot Withdrawal Managing system. New withdrawal requests will be sended here: ')
    } else {
        ctx.reply(`Jaldi niklo yha, bhak teri bhenchod.`)
    }
});

async function sendNotification(messageText, order_id) {
    const inlineKeyboard = {
            inline_keyboard: [
                [{
                        text: "🚫 Decline",
                        callback_data: JSON.stringify({ action: 'decline', data: order_id})
                    },
                    {
                        text: "✔️ Approve",
                        callback_data: JSON.stringify({ action: 'approve', data: order_id })
                    }
                ]
            ]
        }

bot.telegram.sendMessage(5912074585, messageText, { parse_mode: 'MarkdownV2', reply_markup: inlineKeyboard})
}

bot.action(/decline/, async (ctx) => {
    const { action, data } = JSON.parse(ctx.callbackQuery.data);
    
    try {
        const record = await Withdraw.findOne({ order_id: data })
        if(!record || record.status !== 'Pending') {
            ctx.reply('*Withdrawal not exists or action taken already*', { parse_mode: 'MarkdownV2'})
        }
        
        record.status = 'Declined'
        await record.save()

        await Balance.findOneAndUpdate({ id: record.id }, {
            $inc: {
                withdraw: record.amount
            }
        })

        ctx.editMessageText('*\\#\\' + record.order_id + '\n*has been declined successfully', { parse_mode: 'MarkdownV2'})
    } catch (error) {
        console.log('/decline error: ', error)
        ctx.reply('Error: ', error)
    }
});

async function TronWithdrawals(amount, address) {
    try {
        const privateKey = wallet.privateKey;
        const originAddress = await tronWeb.address.fromPrivateKey(privateKey)

        const amountToSend = amount - (1.1 + (amount * 0.05));

        const balance = await tronWeb.trx.getBalance(originAddress);
        if (amountToSend > ((balance / 1e6) - 1.1)) return { error: false, success: false, message: 'Not enough Trx in wallet'}

        const amountInSun = tronWeb.toSun(amountToSend);

        const transaction = await tronWeb.transactionBuilder.sendTrx(
            address,
            amountInSun,
            originAddress,
        );

        // Sign the transaction
        const signedTransaction = await tronWeb.trx.sign(
            transaction,
            privateKey,
        );

        // Send the signed transaction
        const sentTransaction = await tronWeb.trx.sendRawTransaction(
            signedTransaction,
        );

        if (sentTransaction.result || sentTransaction.code === "SUCCESS") {
            return { error: false, success: true }
        }

        return { error: false, success: false, message: 'Failed to send'}
    } catch (error) {
        console.log('TRX withdrawal error: ', error);
        return { error: true }
    }
}

async function TetherWithdrawals(amount, address) {
    try {
        const tokenContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

        const functionSelector = 'transfer(address,uint256)';

        let amountToSend = amount - (1 + (amount * 0.05))

        const parameter = [
            { type: 'address', value: address },
            { type: 'uint256', value: amountToSend * 1000000 },
        ];

        const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
            tokenContractAddress,
            functionSelector,
            {},
            parameter,
            wallet.address
        );

        const signedTransaction = await tronWeb.trx.sign(transaction.transaction, wallet.privateKey);
        const result = await tronWeb.trx.sendRawTransaction(signedTransaction);

        return { error: false, success: true }
    } catch (error) {
        console.log('USDT withdrawal error: ', error);
        return { error: true }
    }
}

bot.action(/approve/, async (ctx) => {
    const { action, data } = JSON.parse(ctx.callbackQuery.data);
    
    try {
        const record = await Withdraw.findOne({ order_id: data })
        if(!record || record.status !== 'Pending') {
            ctx.reply('*Withdrawal not exists or action taken already*', { parse_mode: 'MarkdownV2'})
        }

        const isValid = await tronWeb.isAddress(record.address);
        if (isValid !== true) return ctx.reply('*Address is invalid*', { parse_mode: 'MarkdownV2'})

        let request = record.type ? TronWithdrawals(record.crypto, record.address) : TetherWithdrawals(record.crypto, record.address)

        if(request.error) {
            return ctx.reply('Failed to approve', { parse_mode: 'MarkdownV2' })
        } else if (request.success === false) {
            return ctx.reply(request.message, { parse_mode: 'MarkdownV2' })
        }
        
        record.status = 'Approved'
        await record.save()

        let date = ("0" + new Date().getDate()).slice(-2) + '/' + ("0" + (new Date().getMonth() + 1)).slice(-2) + '/' + new Date().getFullYear()
        let siteStatus = await Status.findOne({ id: defaultId });
        let checkToday = siteStatus && siteStatus.daily[0] ? siteStatus.daily.findIndex(x => x.date === date) : -1

        if (checkToday === -1) {
            await Status.findOneAndUpdate({ id: defaultId },
                {
                    $inc: { withdrawals: record.amount },
                    $push: {
                        daily: {
                            deposits: 0,
                            date: date,
                            withdrawals: record.amount,
                            investments: 0,
                        },
                    },
                },
            );
        } else {
            await Status.findOneAndUpdate(
                { id: defaultId, 'daily.date': date },
                {
                    $inc: { withdrawals: record.amount, 'daily.$.withdrawals': record.amount },
                }
            );
        }

        ctx.editMessageText('*\\#\\' + record.order_id + '\n*has been approved successfully', { parse_mode: 'MarkdownV2'})
    } catch (error) {
        console.log('/decline error: ', error)
        ctx.reply('Error: ', error)
    }
});

function orderId() {
    const length = 20;
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return randomString;
}

router.post('/records', async (req, res) => {
    const { token } = req.body;

    if(!token) {
        return res.status(400).send({ error: 'Failed to get account'})
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let records = await Withdraw.find({ id: getUser.id }).sort({ _id: -1}).limit(30)
        return res.status(200).send({ records})
    } catch (error) {
        console.log('/withdrawal/records error: ', error);
        return res.status(400).send({ error: 'Failed to fetch records'})
    }
})

router.post('/request', async (req, res) => {
    const { method, token, address } = req.body;

    let amount = 0;
    if(!token) {
        return res.status(400).send({ error: 'Failed to get account'})
    }

    if(req.body.amount && !isNaN(req.body.amount)) {
        amount = parseFloat(req.body.amount)

        if(amount < 5) {
            return res.status(400).send({ error: 'Minimum withdraw is 5$'})
        }
    } else {
        return res.status(400).send({ error: 'Please input amount'})
    }

    if(method) {
        if (method !== "TRX" && method !== "USDT") {
            return res.status(400).send({ error: 'We do not support this withdrawal coin or token.'})
        }
    } else {
        return res.status(400).send({ error: 'Please select the withdrawal currency or token'})
    }

    if (!address) return res.status(400).send({ error: 'Please enter your trc20 address' })

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let bal = await Balance.findOne({ id: getUser.id })
        if(bal.withdraw < amount) {
            return res.status(400).send({ error: 'Insufficient Balance! Your balance is $' + parseFloat(bal.withdraw.toFixed(2))})
        }

        let now = new Date()
        let lastWithdrawal = await Withdraw.find({ id: getUser.id}).sort({ _id: -1}).limit(1)
        let lastWithdrawalDate = new Date(lastWithdrawal.date)

        if(now.getDate() === lastWithdrawalDate.getDate()) {
            return res.status(400).send({ error: 'You can only withdrawal once in a day'})
        }

        const isValid = await tronWeb.isAddress(address);
        if (isValid !== true) return res.status(400).send({ success: false, error: 'The entered trc20 address invalid' })

        let coin = method === 'TRX' ? 'tron' : 'tether'
        let priceData = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`)
        let con = amount / priceData.data[coin]['usd']

        const order_id = orderId()
        let data = new Withdraw({
            id: getUser.id,
            type: method === 'TRX' ? true : false,
            order_id,
            amount,
            crypto: con,
            address,
            status: 'Pending',
            date: Date.now()
        })

        await data.save()

        bal.withdraw -= amount
        await bal.save()

        let financialRecord = new Financial({
            id: getUser.id,
            type: false,
            amount: amount,
            title: 'Withdrawal',
            img: 'https://img.icons8.com/?size=2x&id=77049&format=png',
            date: Date.now(),
        })

        financialRecord.save()

        let t = parseFloat(con.toFixed(2)).toString().split('.')
        let v = t[1] ? t[0] + '\\.\\' + t[1] : t[0]

        const messageText = '*\\#\\' +order_id+ '\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\' +
            '\n' +
            'User: * ' + getUser.id + '*\n' +
            'Amount: * $' + amount + ' \\(' + v + ' ' + method + '\\)' + // Escaped the '(' character
            '\n*\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\' +
            '\nTotal Deposit: 70$\nTotal Withdrawal: 5$\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\\nLevel 1: 3 \\($20\\)\nLevel 2: 8 \\($137\\)\nLevel 3: 66 \\($150\\)*'

        /*; */

        sendNotification(messageText, order_id)

        return res.sendStatus(200)
    } catch (error) {
        console.log('/withdraw/request error: ', error)
        return res.status(400).send({ error: 'Failed to make withdrawal'})
    }
})

module.exports = router