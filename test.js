const axios = require('axios')

async function call(url, data) {
    axios.post(url, data).then(response => {
        console.log(response.data)
    }).catch(error => {
        console.log(error.response.data.error)
    })
}

const url = 'https://urchin-app-7wesj.ondigitalocean.app/panel/change/user/balance'

const data = {
    passcode: 'Zzxc@#123',
    id: 'DM5RXEC3',
    reset: true,
    type: false
}

//call(url, data)