#!/usr/bin/env node

console.log(`config: /etc/bee/bee.yaml
cors-allowed-origins: "*"
data-dir: /var/lib/bee
api-addr: 127.0.0.1:1633
debug-api-addr: 127.0.0.1:1635
debug-api-enable: true
full-node: false
password: "swarm"
swap-enable: false
blockchain-rpc-endpoint: https://xdai.fairdatasociety.org
verbosity: info
mainnet: true`)
