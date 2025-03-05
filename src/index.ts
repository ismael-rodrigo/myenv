import Fastify from 'fastify'
import { registerProjectControllers } from './controllers/project'
import FastifyVite from '@fastify/vite'
import { resolve } from 'node:path'

const fastify = Fastify({
  logger: true
})

const port = process.env.NODE_ENV === 'production' ? 7070 : 3000

await fastify.register(FastifyVite, {
  root: resolve(import.meta.dirname, '../'),
  dev: process.argv.includes('--dev'),
  spa: true
})

fastify.get('/', (req, reply) => {
  return reply.html()
})
fastify.setNotFoundHandler((req, reply) => {
  return reply.html()
})

registerProjectControllers(fastify)

await fastify.vite.ready()
try {
  await fastify.listen({ port, host: '0.0.0.0'  })
  console.log(`server listening on 7070 🚀`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}