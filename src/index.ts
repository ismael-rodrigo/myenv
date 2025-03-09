import Fastify from 'fastify'
import { registerProjectControllers } from './controllers/project'
import FastifyVite from '@fastify/vite'
import { resolve } from 'node:path'
import { getPublicIp } from './services/server'

declare global {
  var currentPublicIpv4: string
}
const fastify = Fastify({
  logger: true
})
const isDev = process.env.NODE_ENV === 'production'
const port = isDev ? 3535 : 3000
export const currentPublicIpv4 = isDev ? await getPublicIp() : 'localhost'

globalThis.currentPublicIpv4 = currentPublicIpv4

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
  console.log(`server listening on ${port} 🚀`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

