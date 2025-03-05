import { exec } from 'child_process';
import { promisify } from 'util'
import { join, dirname,  } from 'path';
export const execAsync = (command: string) => promisify(exec)
    (command)
        .then(({ stdout, stderr }) => {
            return { stdout, stderr: stderr ? new Error(stderr) : null }
        })
        .catch((error) => {
            return { stderr: error as Error, stdout: '' }
        })


export type Result<T> = {
    data: T;
    error: Error | null;
}

export const getPaths = (projectId: string) => {
    const basePath = process.env.NODE_ENV === 'production' ? '/tmp/myenv' : './server/tmp'
    const traefikBasePath = process.env.NODE_ENV === 'production' ? '/etc/traefik' : './server/traefik'

    const PROJECT_PATH = join(basePath, 'projects', projectId)
    const PROJECT_ENV = join(basePath, 'projects-env', projectId, '.env')
    const TRAEFIK_DYNAMIC_PATH = join(traefikBasePath, 'dynamic')
    const TRAEFIK_ROOT_PATH = traefikBasePath

    return { 
        PROJECT_PATH, 
        PROJECT_ENV,
        TRAEFIK_DYNAMIC_PATH,
        TRAEFIK_ROOT_PATH
    }
}

export async function readStream(stream: ReadableStream<Uint8Array<ArrayBufferLike>>, onChunk: (chunk: string) => void) {
    console.log('reading stream')
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            onChunk(decoder.decode(value));
        }
    } catch (e) {
        onChunk(String(e));
    }
}