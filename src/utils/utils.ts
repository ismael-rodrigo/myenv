import { exec } from 'child_process';
import { promisify } from 'util'

export const execAsync = (command: string) => promisify(exec)
    (command)
        .then(({ stdout, stderr }) => {
            return { stdout, stderr: new Error(stderr) }
        })
        .catch((error) => {
            return { stderr: error as Error, stdout: '' }
        })


export type Result<T> = {
    data: T;
    error: Error | null;
}

export const getProjectPath = (repository: string)  => {
    //check os 
    if(process.platform === 'win32'){
        return `.\\tmp\\${repository}`
    }
    return `./tmp/${repository}`
}

export const getProjectEnv = async (repository: string) => {
    let path  = `.\\tmp\\env\\${repository}`
    if(process.platform !== 'win32'){
        path = `./tmp/env/${repository}`
    }
    const ifExists = await Bun.file(path).exists()
    return ifExists ? Bun.file(path).json() : {}
}