import { spawn } from "bun";
import { execAsync, getPaths, readStream } from "../utils/utils";
import * as yaml from 'js-yaml'
import { join } from 'path';
import { watch } from "fs";

const DOCKER_COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.yaml']

export const deployFromDockerCompose = async (input: {
    projectId: string;
    environmentKey: string;
}) => {
    const { PROJECT_PATH, TRAEFIK_DYNAMIC_PATH } = getPaths(input.projectId)
    const composeFile = DOCKER_COMPOSE_FILES.find(file => Bun.file(`${PROJECT_PATH}/${file}`).exists())
    if(!composeFile){
        return { error: new Error('docker-compose file not found') }
    }
    const composePath = join(PROJECT_PATH, composeFile)
    const fileContent = await Bun.file(composePath).text()

    const compose = yaml.load(fileContent) as any

    const traefik = {
        http: {
            routers: {},
            services: {}
        }
    } as any
    
    for (const containerName in compose.services) {

        const service = `${input.environmentKey}-${containerName}`
        const traefikHost = `${service}.localhost`
        compose.services[service] = compose.services[containerName]
        delete compose.services[containerName]

        const containerPort = compose.services[service].labels.find((label: string) => label.startsWith("port"))?.split("=")[1]

        if(!containerPort) continue
        
        compose.services[service].networks = ["traefik_proxy"]

        compose.networks = {
            traefik_proxy: {
                external: true
            }
        }
        
        traefik.http.routers[service+"-router"] = {
            rule: `Host(\`${traefikHost}\`)`,
            service: service+"-service",
            entrypoints: ["web"],
            middlewares: []
        }

        traefik.http.services[service+"-service"] = {
            loadBalancer: {
                servers: [ { url: `http://${input.projectId}-${service}-1:${containerPort}` } ],
                passHostHeader: true
            }
        }
    }

    const newCompose = yaml.dump(compose, { noRefs: true });

    const traefikYaml = yaml.dump(traefik, { noRefs: true });

    await Bun.file(composePath).write(newCompose)
    await Bun.file(join(TRAEFIK_DYNAMIC_PATH,`${input.projectId}-${input.environmentKey}.yml`)).write(traefikYaml)

    Bun.spawn(['docker', 'compose', '-p', input.projectId, 'up', '-d' ], {
        cwd: PROJECT_PATH
    })
}

export const getContainersRunning = async (projectId: string) => {
    const result = await execAsync(`docker ps --filter "name=${projectId}" --format "{{.ID}} {{.Names}}"`)
    const containers = result.stdout.split('\n').filter(Boolean).reduce((acc: any, container: string) => {
        const [id, name] = container.split(' ')
        const [_, environmentKey, ...containerName] = name.split('-').slice(1)
        if(!acc[environmentKey]){
            acc[environmentKey] = []
            acc.environments = acc.environments || []
            acc.environments.push(environmentKey)
        }
        acc[environmentKey].push({ id, name: containerName.join('-') })
        return acc
    }, {})
    return containers
}

export const restartContainer = async (containerId: string) => {
    const result = await execAsync(`docker restart ${containerId}`)
    return result
}

export const onContainerLogs = (containerId: string, cb: (logs: {msg: string}[]) => void) => {
    const comannd = `docker logs -f ${containerId}` 
    const process = Bun.spawn(comannd.split(' '))
    const stream = () => readStream(process.stdout, (data)=> {
        const logs = data.split('\n').filter(Boolean).map((log: string) => {
            if(log.startsWith('{') && log.endsWith('}')) return JSON.parse(log)
            return { msg: log, level: 10 }
        })
        cb(logs)
    })

    return {process, stream}
}