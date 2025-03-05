import type { Project } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { getPaths } from "../utils/utils"


export const createProject = (project: Project) => {
    return prisma.project.create({
        data: project
    })
}

export const getProjects = () => {
    return prisma.project.findMany()
}

export const importRepositoryToProject = async (input: {
    repositoryUrl: string,
    repositoryToken: string,
    projectId: string
}) => {

    return await prisma.project.update({
        where: { id: input.projectId },
        data: {
            repositoryUrl: input.repositoryUrl,
            repositoryToken: input.repositoryToken
        }
    })
}

export const saveEnvironmentFile = async (input: {
    projectId: string,
    payload: string
}) => {
    const { PROJECT_ENV } = getPaths(input.projectId)
    await Bun.file(PROJECT_ENV).write(input.payload)
}

export const getEnvironmentContent = async (projectId: string) => {
    const { PROJECT_ENV } = getPaths(projectId)
    const file = Bun.file(PROJECT_ENV)
    if(!file.exists()){
        return null
    }
    return file.text()
}