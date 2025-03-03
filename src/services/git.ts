
import { execAsync, getPaths, type Result } from '../utils/utils';

export const getProject = (repository: string) => {
    return repository.split('/').pop()?.replace('.git', '') || ''
}
export const cloneRepository = async (input: {
    projectId: string;
    repositoryUrl: string;
    githubToken?: string;
}) => {
    const { githubToken } = input
    const repositoryUrl = !!githubToken
        ? `https://${githubToken}@${input.repositoryUrl.replace('https://', '')}` 
        : input.repositoryUrl

    const { PROJECT_PATH } = getPaths(input.projectId)
    console.log(PROJECT_PATH)
    const r = await execAsync(`git config --global --add safe.directory ${PROJECT_PATH}`)
    console.log(r)
    const result = await execAsync(`git clone ${repositoryUrl} ${PROJECT_PATH}`)

    console.log(result)

    return result
}

export const checkoutBranch = async ({ branch, projectId }: { branch: string, projectId: string }) => {
    const { PROJECT_PATH } = getPaths(projectId)
    const gitDir = `${PROJECT_PATH}/.git`
    const envGit = `--git-dir=${gitDir} --work-tree=${PROJECT_PATH}`
    const execCommand = `
        git ${envGit} checkout ${branch} &&
        git ${envGit} fetch origin ${branch} &&
        git ${envGit} reset --hard origin/${branch}
    `

    const result = await execAsync(execCommand)

    // Add logs

    return result
}