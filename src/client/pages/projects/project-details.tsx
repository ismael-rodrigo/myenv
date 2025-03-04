import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"

type Project = {
    id: string
    name: string
}
type ProjectContainers = {
    [key: string]: {
        id: string
        name: string
        status: string
        state: string	
    }[]
} & {
    environments: string[]
}
type ProjectDetailsQuery = {
    project: Project
    containers: ProjectContainers
}

export const projectQuery = (id: string, enabled: boolean) => useQuery({
    queryKey: ['projects', id],
    enabled,
    queryFn: async () => {
        const response = await fetch(`/api/projects/${id}`)
        return response.json() as Promise<ProjectDetailsQuery>
    }
})

export const ProjectDetailsPage = () => {
    const projectId = useParams<{id: string}>().id
    const isCreating = projectId === 'create'
    const { data } = projectQuery(projectId!, !isCreating)
    const navigate = useNavigate()

    return (
        <div>
            <div className="flex items-center gap-2">
                <button className="btn h-8 btn-xs" onClick={()=>navigate('/projects')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h1 className="text-lg font-semibold capitalize">
                    {isCreating ? 'Criar projeto' : data?.project.name}
                </h1>
            </div>
            <div className="mt-5">
                <ul className="list bg-base-100 rounded-box shadow-md border border-base-200">
                    <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">    
                        Ambientes configurados
                    </li>

                    {
                        data?.containers?.environments?.map((env) => (
                            <li className="list-row" key={env}>
                                <div className="list-col-grow">
                                    <div className="text-xs font-semibold capitalize">{env}</div>
                                    <div className="flex gap-2">
                                        <div className="text-xs font-semibold opacity-60">Containers</div>
                                        <div className="text-xs font-semibold opacity-60 text-success">{data?.containers[env].filter(c => c.state === 'running').length} Rodando</div>
                                        <div className="text-xs font-semibold opacity-60 text-error">{data?.containers[env].filter(c => c.state === 'exited').length} Parado</div>
                                    </div>
                                </div>
                                <button className="btn btn-square btn-ghost btn-neutral" onClick={()=>navigate(`env/${env}`)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[1.2em] lucide lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
                                </button>
                            </li>
                        ))
                    }
                </ul>
            </div>
        </div>
    )
}