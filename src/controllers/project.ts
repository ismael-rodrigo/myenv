import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { getBranches } from "../services/github";
import { checkoutBranch, cloneRepository } from "../services/git";
import { deployFromDockerCompose, onContainerLogs } from "../services/docker";

export const registerProjectControllers = (fastify: FastifyInstance) => {
    fastify.get('/api/projects/list', async () => {
        return prisma.project.findMany()
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
        return prisma.project.findUnique({
            where: { id }
        })
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

    fastify.post('/api/projects/:id/deploy-branch', async (request) => {
        const { id } = request.params as { id: string }
        const { branch, type } = request.body as { branch: string, type: 'docker-compose' }
        const project = await prisma.project.findUnique({
            where: { id }
        })
        if(!project || !project.repositoryUrl || !branch || !type){
            return { error: 'Bad request' }
        }

        await checkoutBranch({ branch, projectId: project.id })
        if(type === 'docker-compose'){
            await deployFromDockerCompose({ projectId: project.id, environmentKey: branch })
        } else {
            return { error: 'Bad request' }
        }
        return { success: true }
    })
    
    fastify.get('/api/container-logs/:containerId', async (request, reply) => {
        const { containerId } = request.params as { containerId: string }
        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')
        reply.raw.write(`data: connected sssssss\n\n`)
        const logger = onContainerLogs(containerId, (data) => {
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
        })
        request.raw.on('close', () => {
            reply.raw.end()
            logger.process.kill()
            console.log('closed connection ' + containerId)
        })
        await logger.stream()
    })
    
}