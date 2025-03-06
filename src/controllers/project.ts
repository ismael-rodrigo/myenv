import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { getBranches } from "../services/github";
import { checkoutBranch, cloneRepository } from "../services/git";
import { deployFromDockerCompose, getContainersRunning, onContainerLogs, restartContainers, stopContainers, upContainers } from "../services/docker";
import { getEnvironmentContent, saveEnvironmentFile } from "../services/project";

export const registerProjectControllers = (fastify: FastifyInstance) => {
    fastify.get('/api/projects/list', async () => {
        return prisma.project.findMany({
            select: { id: true, name: true, repositoryUrl: true }
        })
    })

    fastify.post('/api/projects/create', async (request) => {
        const { name } = request.body as { name: string }
        return prisma.project.create({
            data: {
                name            
            }
        })
    })

    fastify.get('/api/projects/:id', async (request) => {
        const { id } = request.params as { id: string }
        const project = await prisma.project.findUnique({
            where: { id }
        })
        if(!project){
            return { error: 'Project not found' }
        }
        const containers = await getContainersRunning(project.id)
        return { project, containers }
    })

    fastify.delete('/api/projects/:id', async (request) => {
        const { id } = request.params as { id: string }
        return prisma.project.delete({
            where: { id }
        })
    })

    fastify.post('/api/projects/:id/add-repository', async (request) => {
        const { id } = request.params as { id: string }
        const { repositoryToken, repositoryUrl } = request.body as { repositoryUrl: string, repositoryToken?: string }
        const project = await prisma.project.update({
            where: { id },
            data: { 
                repositoryToken,
                repositoryUrl
            }
        })
        if(!project || !project.repositoryUrl){
            return { error: 'Bad request' }
        }
        await cloneRepository({ projectId: project.id, repositoryUrl: project.repositoryUrl, githubToken: repositoryToken })
    })

    fastify.get('/api/projects/:id/list-repository-branches', async (request) => {
        const { id } = request.params as { id: string }
        const project = await prisma.project.findUnique({
            where: { id }
        })
        if(!project || !project.repositoryUrl){
            return { error: 'Project not found' }
        }
        return getBranches({ repositoryUrl: project.repositoryUrl, repositoryToken: project.repositoryToken || undefined })
    })

    fastify.get('/api/projects/:id/deploy-branch', async (request, reply) => {
        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')

        const { id } = request.params as { id: string }
        const { branch } = request.query as { branch: string }

        const project = await prisma.project.findUnique({
            where: { id }
        })
        if(!project || !project.repositoryUrl || !branch){
            return { error: 'Bad request' }
        }

        const checkout = await checkoutBranch({ branch, projectId: project.id })

        reply.raw.write(`data: Checking out branch ${branch}\n\n`)
        reply.raw.write(`data: ${checkout.stdout || checkout.stderr}\n\n`)

        await deployFromDockerCompose({ projectId: project.id, environmentKey: branch }, (data) => {
            reply.raw.write(`data: ${data}\n\n`)
        })
        reply.raw.write(`data: finished\n\n`)
        reply.raw.end()
    })
    
    fastify.get('/api/container-logs/:containerId', async (request, reply) => {
        const { containerId } = request.params as { containerId: string }
        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')

        reply.raw.write(`data: Connected to container ${containerId} logs\n\n`)

        const logger = await onContainerLogs(containerId, (data) => {
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
        })

        request.raw.on('close', () => {
            logger.process.kill()
            reply.raw.end()
            console.log('closed connection ' + containerId)
        })
        await logger.stream()
    })
    
    fastify.post('/api/restart-containers', async (request) => {
        const { containerIds } = request.body as { containerIds: string[] }
        return restartContainers(containerIds)
    })

    fastify.post('/api/stop-containers', async (request) => {
        const { containerIds } = request.body as { containerIds: string[] }
        return stopContainers(containerIds)
    })

    fastify.post('/api/up-containers', async (request) => {
        const { containerIds } = request.body as { containerIds: string[] }
        return upContainers(containerIds)
    })

    fastify.post('/api/projects/:id/envfile', async (request) => {
        const { id } = request.params as { id: string }
        const { payload } = request.body as { payload: string }
        await saveEnvironmentFile({ projectId: id, payload })
        return { success: true }
    })

    fastify.get('/api/projects/:id/envfile', async (request) => {
        const { id } = request.params as { id: string }
        const payload = await getEnvironmentContent(id)
        return { payload }
    })
}