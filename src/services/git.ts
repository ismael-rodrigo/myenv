
import { execAsync, getProjectPath, type Result } from '../utils/utils';

type CloneRepoInput = {
    repositoryUrl: string;
}
export const getProject = (repository: string) => {
    return repository.split('/').pop()?.replace('.git', '') || ''
}
export const cloneRepo = async (input: CloneRepoInput): Promise<Result<boolean>> => {
    const githubToken = process.env.GITHUB_TOKEN

    let repositoryUrl = !!githubToken 
        ? `https://${githubToken}@${input.repositoryUrl.replace('https://', '')}` 
        : input.repositoryUrl

    
    const projectPath = getProjectPath(getProject(input.repositoryUrl))

    await execAsync(`git config --global --add safe.directory ${projectPath}`)

    const result = await execAsync(`git clone ${repositoryUrl} ${projectPath}`)

    if(result.stderr){
        if(result.stderr.message.includes('is not an empty directory')){
            return { data: true, error: null }
        }
        if(result.stderr.message == `Cloning into '${projectPath}'...\n`){
            return { data: true, error: null }
        }
        return { data: false, error: result.stderr }
    }

    return { data: true, error: null }
}

export const checkoutBranch = async ({ branch, project }: { branch: string, project: string }) => {
    const pathname = getProjectPath(project)
    const execCommand = `cd ${pathname} && git checkout ${branch} -f && git pull`

    const { stderr, stdout } = await execAsync(execCommand)

    if(stderr){
        if(stderr.message.includes('Already on')){
            return { data: true, error: null }
        }
        if([`Switched to a new branch '${branch}'\n`, `Switched to branch '${branch}'\n`].includes(stderr.message)){
            return { data: true, error: null }
        }
    }
    return { data: stdout, error: stderr }
}