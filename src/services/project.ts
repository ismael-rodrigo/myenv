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

    const result = await prisma.project.update({
        where: { id: input.projectId },
        data: {
            repositoryUrl: input.repositoryUrl,
            repositoryToken: input.repositoryToken
        }
    })
}
