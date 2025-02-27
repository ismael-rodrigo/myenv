import Fastify from 'fastify'
import { runProjectCompose, updateComposeFile } from './services/traefik'
import { checkoutBranch, cloneRepo, getProject } from './services/git'


const fastify = Fastify({
  logger: true
})

type HookPayload = {
    repository: string;
    branch: string;
}

fastify.post('/hook', async function handler(request, reply) {
    const payload = request.body as HookPayload
    
    const cloneResult = await cloneRepo({ repositoryUrl: payload.repository })

    if(cloneResult.error){
        return reply.code(400).send(cloneResult.error)
    }
    const project = getProject(payload.repository)
    const checkoutResult = await checkoutBranch({ branch: payload.branch, project })

    if(checkoutResult.error){
        return reply.code(400).send(checkoutResult.error)
    }
    const composeResult = await updateComposeFile({ project, key: payload.branch })

    if(composeResult.error){
        return reply.code(400).send(composeResult.error)
    }

    const runResult = await runProjectCompose({ project })

    return { data: runResult.data }
})

try {
  await fastify.listen({ port: 7070, host: '0.0.0.0'  })
  console.log(`server listening on 7070 🚀`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}