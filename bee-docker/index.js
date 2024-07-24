#!/usr/bin/env node

const { writeFileSync, mkdirSync, existsSync } = require('fs')
const { join } = require('path')
const { Wallet } = require('@ethersproject/wallet')

main()

async function main() {
    const count = parseInt(process.argv[2], 10)
    if (typeof count !== 'number' || isNaN(count)) {
        console.error('Please provide a number')
        process.exit(1)
    }

    writeFileSync(
        'docker-compose.yml',
        `services:
${Array.from({ length: count }, (_, i) => createService(i)).join('\n')}
`
    )

    const addresses = []
    for (let i = 0; i < count; i++) {
        console.log(`Creating node ${i + 1}`)
        const directory = `node_${(i + 1).toString().padStart(2, '0')}`
        if (existsSync(directory)) {
            console.error(`Directory ${directory} already exists`)
            process.exit(1)
        }
        const keysDirectory = join(directory, 'bee-data', 'keys')
        mkdirSync(keysDirectory, { recursive: true })
        const password = 'z' + Wallet.createRandom().address.slice(23)
        addresses.push(await placeKey(keysDirectory, password))
        writeFileSync(
            join(directory, 'bee.yml'),
            `# GENERAL BEE CONFIGURATION
api-addr: :1633
p2p-addr: :1634
debug-api-addr: :1635
password: ${password}
data-dir: /home/bee/bee-data
cors-allowed-origins: ["*"]

# DEBUG CONFIGURATION
debug-api-enable: true
verbosity: 5

# BEE MAINNET CONFIGURATION
bootnode: /dnsaddr/mainnet.ethswarm.org
blockchain-rpc-endpoint: https://xdai.fairdatasociety.org

# BEE MODE: FULL NODE CONFIGURATION
swap-enable: true
full-node: true
`
        )
    }
    writeFileSync('addresses.txt', addresses.join('\n') + '\n')
    console.log('docker-compose.yml created')
    console.log('addresses.txt created')
    console.log('Directories created')
}

function createService(i) {
    return `    bee_${(i + 1).toString().padStart(2, '0')}:
        container_name: bee-node_${(i + 1).toString().padStart(2, '0')}
        image: ethersphere/bee:stable
        command: start --config /home/bee/bee.yml
        user: ${process.env.USER ?? 'root'}
        volumes:
            - ./node_${(i + 1).toString().padStart(2, '0')}:/home/bee/
        ports:
            - 127.0.0.1:${1633 + i * 3}:1633 # bee api port
            - ${1634 + i * 3}:1634 # p2p port
            - 127.0.0.1:${1635 + i * 3}:1635 # debug port`
}

async function placeKey(directory, password) {
    const wallet = Wallet.createRandom()
    const v3 = await wallet.encrypt(password)
    writeFileSync(join(directory, 'swarm.key'), v3)
    return wallet.address
}
