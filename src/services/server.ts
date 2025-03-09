import type { Project } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { getPaths } from "../utils/utils"
import { publicIpv4 } from "public-ip";
import {  dirname } from 'path';
import { readdir, rm } from "node:fs/promises";
import { removeContainers } from "./docker";
import { join } from "node:path";
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
    try {
        const { PROJECT_ENV } = getPaths(projectId)
        console.log(PROJECT_ENV, "exec")
        const file = Bun.file(PROJECT_ENV)
        if(!(await file.exists())){
            return null
        }
        return file.text()
    }
    catch (error) {
        return null
    }
}

export const getPublicIp = async () => {
    return publicIpv4()
}

export const mountTraefikPublicHost = async (input: {
    publicIpv4?: string,
    serviceName: string
}) => {
    input.publicIpv4 = input.publicIpv4 || globalThis.currentPublicIpv4
    const { publicIpv4, serviceName } = input
    const traefikHost = `${serviceName}.${publicIpv4}.traefik.me`
    return traefikHost
}

export const removeProjectDependencies = async (projectId: string) => {
    const { PROJECT_PATH, PROJECT_ENV, TRAEFIK_DYNAMIC_PATH } = getPaths(projectId)
    await removeContainers({
        name: projectId
    })
    await rm(PROJECT_PATH, { recursive: true })
    await rm(dirname(PROJECT_ENV), { recursive: true })
    const fileToDelete = await readdir(TRAEFIK_DYNAMIC_PATH)
    for (const file of fileToDelete) {
        if(file.startsWith(projectId)){
            await Bun.file(join(TRAEFIK_DYNAMIC_PATH, file)).delete()
        }
    }
    await prisma.project.delete({
        where: { id: projectId }
    })
}