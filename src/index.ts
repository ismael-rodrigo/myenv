import Fastify from 'fastify'
import { registerProjectControllers } from './controllers/project'


const fastify = Fastify({
  logger: true
})

registerProjectControllers(fastify)

try {
  await fastify.listen({ port: 7070, host: '0.0.0.0'  })
  console.log(`server listening on 7070 🚀`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}