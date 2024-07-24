# bee-docker

Creates docker-compose.yml and directory layout for multiple Bee nodes. Grabs wallet addresses and puts them in addresses.txt for convenience.

```
npx bee-docker 3
```

# bee-yaml

Prints an ultra-light Bee configuration file to stdout.

```
mkdir -p /etc/bee
npx bee-yaml > /etc/bee/bee.yaml
```
