const axios = require('axios')

async function call(url, data) {
    axios.post(url, data).then(response => {
        console.log(response.data)
    }).catch(error => {
        console.log(error.response.data.error)
    })
}

const url = 'https://urchin-app-7wesj.ondigitalocean.app/user/data'

const data = {
    passcode: 'Zzxc@#123',
    id: '7DOMR1HH'
}

call(url, data)