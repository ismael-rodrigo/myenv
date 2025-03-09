import { execAsync, getPaths, readStream } from "../utils/utils";
import * as yaml from 'js-yaml'
import { join } from 'path';
import { getEnvironmentContent, getPublicIp, mountTraefikPublicHost } from "./server";

const DOCKER_COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.yaml']

export const deployFromDockerCompose = async (input: {
    projectId: string;
    environmentKey: string;
},logger: (log:string) => void) => {

    const { PROJECT_PATH, TRAEFIK_DYNAMIC_PATH, PROJECT_ENV } = getPaths(input.projectId)
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
    const publicIpv4 = await getPublicIp()

    for (const containerName in compose.services) {
        const containerPort = compose.services[containerName].labels?.find((label: string) => label.startsWith("myenv.port="))?.split("=")[1]
        if(!containerPort) {
            delete compose.services[containerName]
            continue
        }
        const service = `${input.environmentKey}-${containerName}`
        const traefikHost = await mountTraefikPublicHost({ publicIpv4, serviceName: service })
        compose.services[service] = compose.services[containerName]

        delete compose.services[containerName]
        delete compose.services[service].ports

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

        logger(`Configured traefik and compose file to container ${containerName} ✅` )
    }

    const newCompose = yaml.dump(compose, { noRefs: true });
    const traefikYaml = yaml.dump(traefik, { noRefs: true });

    await Bun.file(composePath).write(newCompose)
    await Bun.file(join(TRAEFIK_DYNAMIC_PATH,`${input.projectId}-${input.environmentKey}.yml`)).write(traefikYaml)

    const envFile = await getEnvironmentContent(input.projectId)
    envFile && await Bun.file(join(PROJECT_PATH, '.env')).write(envFile)
    envFile && logger(`Updated .env file with environment variables ✅`)
    
    logger(`Deployed ${input.environmentKey} environment ✅`)

    const proccess = Bun.spawn(['docker', 'compose', '-p', input.projectId, 'up', '-d', '--force-recreate', '--build' ], {
        cwd: PROJECT_PATH
    })

    await readStream(proccess.stdout, (data) => {
        logger(data)
    })
}

type ContainerLs = {
    ID: string;
    Names: string;
    State: string;
    Status: string;
}
export const getContainersRunning = async (projectId: string) => {
    const result = await execAsync(`docker ps --filter "name=${projectId}" --format "{{json .}}" --all`)
    const containersFiltered = result.stdout.split('\n').filter(Boolean).map((container: string) => JSON.parse(container)) as ContainerLs[]
    const containers = containersFiltered.reduce(async (acc: any, container) => {
        const { ID: id, Names: name, State: state, Status: status } = container
        const [_, environmentKey, ...containerFullName] = name.split('-').slice(0, -1)

        const containerName = containerFullName.join('-')
        const serviceName = `${environmentKey}-${containerName}`
        const externalHost = await mountTraefikPublicHost({ serviceName })

        if(!acc[environmentKey]){
            acc[environmentKey] = []
            acc.environments = acc.environments || []
            acc.environments.push(environmentKey)
        }
        acc[environmentKey].push({ id, name: containerName, status, state, externalHost: `http://${externalHost}` })
        return acc
    }, {})
    return containers
}

export const restartContainers = async (containerIds: string[]) => {
    const result = await execAsync(`docker restart ${containerIds.join(' ')}`)
    return result
}

export const stopContainers = async (containerIds: string[]) => {
    const result = await execAsync(`docker stop ${containerIds.join(' ')}`)
    return result
}

export const upContainers = async (containerIds: string[]) => {
    const result = await execAsync(`docker start ${containerIds.join(' ')}`)
    return result
}

export const onContainerLogs = async (containerId: string, cb: (logs: object) => void) => {
    const comannd = `docker logs -f ${containerId} -n 50` 
    const process = Bun.spawn(comannd.split(' '), {
        
    })
    const stream = () => readStream(process.stdout, (data)=> {
        const logs = data.split('\n').filter(Boolean).map((log: string) => {
            if(log.startsWith('{') && log.endsWith('}')) return JSON.parse(log)
            return { msg: log, level: 10 }
        })
        cb({logs})
    })
    return {process, stream}
}

export const removeContainers = async (filter: Record<'name', string> | Record<'id', string>) => {
    const filterAsString = Object.entries(filter).map(([key, value]) => `--filter "${key}=${value}"`)[0] 
    const command = `docker rm -vf $(docker ps -a -q ${filterAsString})`
    const result = await execAsync(command)
    return result
}