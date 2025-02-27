import { execAsync, getProjectEnv, getProjectPath } from "../utils/utils";
import * as yaml from 'js-yaml'

const DOCKER_COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.yaml']

export const updateComposeFile = async (input: {
    project: string;
    key: string;
}) => {
    const path = getProjectPath(input.project)
    const composeFile = DOCKER_COMPOSE_FILES.find(file => Bun.file(`${path}/${file}`).exists())
    if(!composeFile){
        return { error: new Error('docker-compose file not found') }
    }
    const composePath = `${path}/${composeFile}`
    const fileContent = await Bun.file(composePath).text()

    let compose = yaml.load(fileContent) as any

    const traefik = {
        http: {
            routers: {},
            services: {}
        }
    } as any
    
    for (const containerName in compose.services) {

        const service = `${input.key}_${containerName}`
        const containerPort = compose.services[containerName].labels.find((label: string) => label.startsWith("port"))?.split("=")[1] || 80

        compose.services[containerName].container_name = service
        compose.services[containerName].networks = ["traefik_proxy"]
        compose.networks = {
            traefik_proxy: {
                external: true
            }
        }

        traefik.http.routers[service+"-router"] = {
            rule: `Host(\`${service}.localhost\`)`,
            service: service+"-service",
            entrypoints: ["web"],
            middlewares: []
        }

        traefik.http.services[service+"-service"] = {
            loadBalancer: {
                servers: [ { url: `http://${service}:${containerPort}` } ],
                passHostHeader: true
            }
        }
    }

    const newYaml = yaml.dump(compose, { noRefs: true });
    
    const traefikYaml = yaml.dump(traefik, { noRefs: true });

    await Bun.file(composePath).write(newYaml)

    if(import.meta.env.MODE === 'development'){
        await Bun.file(`./tmp/${input.project}/traefik.yml`).write(traefikYaml)
    } else {
        await Bun.file(`/etc/traefik/dynamic/${input.key}.yml`).write(traefikYaml)
    }

    return { data: true, error: null }
}

export const runProjectCompose = async (input: {
    project: string;
}) => {
    const path = getProjectPath(input.project)
    const composeFile = DOCKER_COMPOSE_FILES.find(async file => await Bun.file(`${path}/${file}`).exists())
    if(!composeFile){
        return { error: new Error('docker-compose file not found') }
    }

    const result = await execAsync(`docker-compose -f ${path}/${composeFile} up -d`)

    console.log(result)
    
    if(result.stderr){
        return { error: result.stderr }
    }

    return { data: true, error: null }
}