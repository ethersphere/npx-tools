# bee-docker

Creates docker-compose.yml and directory layout for multiple Bee nodes. Grabs wallet addresses and puts them in addresses.txt for convenience.

```
npx bee-docker 3

docker compose up
```

# bee-yaml

Prints an ultra-light Bee configuration file to stdout.

```
mkdir -p /etc/bee

npx bee-yaml > /etc/bee/bee.yaml
```

# create-swarm-app

Scaffolds a browser or Node.js application. Supports React (Vite) and Node.js (CommonJS, ESM, TypeScript).

```
npx create-swarm-app my-app vite-tsx

cd my-app
npm install
npm start
```
