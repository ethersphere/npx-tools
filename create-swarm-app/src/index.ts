#!/usr/bin/env node

import { Strings } from 'cafe-utility'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { exit } from 'process'

type CodeType = 'typescript' | 'esmodules' | 'commonjs'
type ProjectType = 'node' | 'vite'

main(process.argv[2], process.argv[3])

async function main(projectName: string, type: string) {
    if (!projectName || !type) {
        console.error('Usage:   npm init swarm-app <name> <type>')
        console.error('Example: npm init swarm-app my-app node-ts')
        console.error('')
        console.error('Possible types: node, node-esm, node-ts, vite-tsx')
        exit(1)
    }
    if (!['node', 'node-esm', 'node-ts', 'vite-tsx'].includes(type)) {
        console.error('Possible types: node, node-esm, node-ts, vite-tsx')
        exit(1)
    }
    const codeType: CodeType =
        type.endsWith('ts') || type.endsWith('tsx') ? 'typescript' : type.endsWith('esm') ? 'esmodules' : 'commonjs'
    const projectType: ProjectType = type.startsWith('node') ? 'node' : 'vite'

    if (existsSync(projectName)) {
        console.error('Project already exists')
        exit(1)
    }
    mkdirSync(projectName)
    mkdirSync(projectName + '/src')
    const packageJson: any = {
        name: Strings.slugify(projectName),
        version: '1.0.0',
        scripts: {},
        license: 'ISC',
        dependencies: {
            '@ethersphere/bee-js': '^8.2.0'
        },
        devDependencies: {}
    }
    if (codeType === 'typescript') {
        packageJson.devDependencies.typescript = '^5.5.3'
    }
    if (projectType === 'vite') {
        packageJson.dependencies.react = '^18.3.1'
        packageJson.dependencies['react-dom'] = '^18.3.1'
        packageJson.devDependencies['@types/react'] = '^18.3.3'
        packageJson.devDependencies['@types/react-dom'] = '^18.3.0'
    }
    if (codeType === 'esmodules') {
        packageJson.type = 'module'
    }
    if (projectType === 'vite') {
        packageJson.devDependencies['vite'] = '^5.3.4'
        packageJson.scripts.start = 'vite'
        packageJson.scripts.build = 'vite build'
        packageJson.scripts.check = 'tsc --noEmit'
    }
    if (projectType === 'node' && codeType === 'typescript') {
        packageJson.devDependencies['ts-node'] = '^10.9.2'
        packageJson.scripts.start = 'ts-node src/index.ts'
        packageJson.scripts.build = 'tsc'
        packageJson.scripts.check = 'tsc --noEmit'
    }
    if (projectType === 'node' && codeType === 'commonjs') {
        packageJson.scripts.start = 'node src/index.js'
    }
    if (projectType === 'node' && codeType === 'esmodules') {
        packageJson.scripts.start = 'node --experimental-specifier-resolution=node src/index.js'
    }

    const config =
        codeType === 'commonjs'
            ? `module.exports = { BEE_HOST: 'http://localhost:1633' }\n`
            : `export const BEE_HOST = 'http://localhost:1633'\n`

    const appTsx = `import { BatchId, Bee } from '@ethersphere/bee-js'
import { useState } from 'react'
import { BEE_HOST } from './config'

export function App() {
    const [batchId, setBatchId] = useState<BatchId | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [fileList, setFileList] = useState<FileList | null>(null)
    const [swarmHash, setSwarmHash] = useState<string | null>(null)

    async function getOrCreatePostageBatch() {
        const bee = new Bee(BEE_HOST)

        const batches = await bee.getAllPostageBatch()
        const usable = batches.find(x => x.usable)

        if (usable) {
            setBatchId(usable.batchID)
        } else {
            setBatchId(await bee.createPostageBatch('500000000', 20))
        }
    }

    async function uploadFile() {
        if (!batchId) {
            return
        }
        const bee = new Bee(BEE_HOST)
        const result = await bee.uploadFile(batchId, file)
        setSwarmHash(result.reference)
        setFile(null)
    }

    async function uploadDirectory() {
        if (!batchId || !fileList) {
            return
        }
        const bee = new Bee(BEE_HOST)
        const result = await bee.uploadFiles(batchId, fileList)
        setSwarmHash(result.reference)
        setFileList(null)
    }

    const directoryInputAttributes = {
        webkitdirectory: '',
        directory: '',
        multiple: true
    }

    return (
        <div>
            {!batchId && <button onClick={getOrCreatePostageBatch}>Get or create postage batch</button>}
            {batchId && <p>Batch ID: {batchId}</p>}
            {batchId && !swarmHash && (
                <div>
                    <p>Single file upload</p>
                    <input type="file" onChange={e => setFile(e.target.files![0])} />
                    <button onClick={uploadFile}>Upload file</button>

                    <p>Directory upload</p>
                    <input type="file" onChange={e => setFileList(e.target.files)} {...directoryInputAttributes} />
                    <button onClick={uploadDirectory}>Upload directory</button>
                </div>
            )}
            {swarmHash && <a href={BEE_HOST + '/bzz/' + swarmHash}>Swarm hash: {swarmHash}</a>}
        </div>
    )
}
`
    const indexTsx = `import { createRoot } from 'react-dom/client'
import { App } from './App'

const rootElement = document.getElementById('root')
if (rootElement) {
    const root = createRoot(rootElement)
    root.render(<App />)
}
`
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Swarm App</title>
    </head> 
    <body>
        <div id="root"></div>
        <script type="module" src="src/index.tsx"></script>
    </body>
</html>
`
    const viteTsConfig = `{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "esModuleInterop": true,

        /* Bundler mode */
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",

        /* Linting */
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
    },
    "include": ["src"]
}
`
    const nodeTsConfig = `{
    "$schema": "https://json.schemastore.org/tsconfig",
    "display": "Node 16",

    "compilerOptions": {
        "outDir": "dist",
        "lib": ["ES2022"],
        "module": "CommonJS",
        "target": "ES2022",
        "declaration": false,
        "strict": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "moduleResolution": "node",
        "esModuleInterop": true,
        "noImplicitAny": true,
        "strictNullChecks": true
    }
}
`
    function makeImport(imports: string[], location: string) {
        return codeType === 'commonjs'
            ? `const { ${imports.join(', ')} } = require('${location}')`
            : `import { ${imports.join(', ')} } from '${location}${
                  location.startsWith('.') && codeType === 'esmodules' ? '.js' : ''
              }'`
    }
    const indexTs = `${makeImport(['Bee'], '@ethersphere/bee-js')}
${makeImport(['BEE_HOST'], './config')}

main()

async function main() {
    const bee = new Bee(BEE_HOST)
    const batchId = await getOrCreatePostageBatch(bee)
    console.log('Batch ID', batchId)
    const data = 'Hello, world! The current time is ' + new Date().toLocaleString()
    const uploadResult = await bee.uploadData(batchId, data)
    console.log('Swarm hash', uploadResult.reference)
    const downloadResult = await bee.downloadData(uploadResult.reference)
    console.log('Downloaded data:', downloadResult.text())
}

async function getOrCreatePostageBatch(${codeType === 'typescript' ? 'bee: Bee' : 'bee'}) {
    const batches = await bee.getAllPostageBatch()
    const usable = batches.find(x => x.usable)
  
    if (usable) {
        return usable.batchID
    } else {
        return bee.createPostageBatch('500000000', 20)
    }
}
`
    writeFileSync(`${projectName}/package.json`, JSON.stringify(packageJson, null, 4))
    if (projectType === 'vite') {
        writeFileSync(`${projectName}/src/App.tsx`, appTsx)
        writeFileSync(`${projectName}/src/index.tsx`, indexTsx)
        writeFileSync(`${projectName}/src/config.ts`, config)
        writeFileSync(`${projectName}/tsconfig.json`, viteTsConfig)
        writeFileSync(`${projectName}/index.html`, indexHtml)
    }
    if (projectType === 'node') {
        if (codeType === 'typescript') {
            writeFileSync(`${projectName}/tsconfig.json`, nodeTsConfig)
            writeFileSync(`${projectName}/src/index.ts`, indexTs)
            writeFileSync(`${projectName}/src/config.ts`, config)
        } else {
            writeFileSync(`${projectName}/src/index.js`, indexTs)
            writeFileSync(`${projectName}/src/config.js`, config)
        }
    }
    console.log('Project created')
    console.log('')
    console.log('cd ' + projectName)
    console.log('npm install')
    console.log('npm start')
}
