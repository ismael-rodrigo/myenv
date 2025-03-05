import { useForm } from "@tanstack/react-form"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"

type Project = {
    id: string
    name: string
    repositoryUrl?: string
    repositoryToken?: string
}
export type ProjectContainers = {
    [key: string]: {
        id: string
        name: string
        status: string
        state: string	
    }[]
} & {
    environments: string[]
}
export type ProjectDetailsQuery = {
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
    const { data, isPending } = projectQuery(projectId!, !isCreating)
    const navigate = useNavigate()



    return (
        <div>
            <div className="flex justify-between">
                <div className="flex items-center gap-2">
                    <button className="btn h-8 btn-xs" onClick={()=>navigate('/projects')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <h1 className="text-lg font-semibold capitalize">
                        {isCreating ? 'Criar projeto' : data?.project?.name}
                    </h1>
                </div>
               
            </div>
            <div className="mt-5 gap-2 flex flex-col">
                {
                    isPending 
                        ? <div className="loading loading-lg"></div>
                        : <div className="tabs tabs-lift">
                            <input type="radio" name="my_tabs_3" className="tab" aria-label="Enviroments" defaultChecked={!!data} />
                            <div className="tab-content bg-base-100 border-base-300 p-6"><EnviromentsCard data={data}  /></div>
        
                            <input type="radio" name="my_tabs_3" className="tab" aria-label="Variables" />
                            <div className="tab-content bg-base-100 border-base-300 p-6"><EnvFileCard data={data} /></div>
        
                            <input type="radio" name="my_tabs_3" className="tab" aria-label="Configurations" defaultChecked={!data} />
                            <div className="tab-content bg-base-100 border-base-300 p-6"><RepositoryCard data={data} /></div>
                        </div>
                }
                
            </div>
        </div>
    )
}


const envFileQuery = (id: string) => useQuery({
    queryKey: ['envFile', id],
    queryFn: async () => {
        const response = await fetch(`/api/projects/${id}/envfile`)
        return await response.json()
    }
})

const EnvFileCard = ({ data }: {data: ProjectDetailsQuery | undefined}) => {
    const [isEditing, setIsEditing] = useState(false)
    const { data: envFile } = envFileQuery(data?.project.id!)
    const [content, setContent] = useState(envFile?.payload)
    const [loading, setLoading] = useState(false)

    const onSubmit = async () => {
        setLoading(true)
        await fetch(`/api/projects/${data?.project.id}/envfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ payload: content })
        })
        .then(() => {
            setIsEditing(false)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="card bg-base-200 shadow-md border border-base-200">
            <div className="card-body">
                <div className="flex justify-between items-center">
                    <h2 className="card-title">Environment variables</h2>
                    <button className="btn btn-neutral" onClick={()=>{
                        setIsEditing(t => {
                            if(t){
                                setContent(envFile?.payload)
                            }
                            return !t
                        })}
                    }>{
                        isEditing ? 'Cancel' : 'Edit'
                    }</button>
                </div>
                <div className="mt-3">
                    <textarea value={content} onChange={e => setContent(e.target.value)} className="text-nowrap textarea text-base overflow-x-auto bg-base-200 p-4 rounded-md w-full h-[200px]" disabled={!isEditing} defaultValue={envFile?.payload} />
                    <div className="mt-5 w-2/3">
                        <h3 className="card-title text-base">Dynamic Variables</h3>
                        <div className="divider h-1"></div>
                        <div className="flex justify-between items-center">
                            <p>External Container Host</p>
                            <kbd className="kbd kbd-md">{"<container name> + _HOST"}</kbd>
                        </div>
                        <div className="divider h-1"></div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}




const RepositoryCard = ({ data }: {data: ProjectDetailsQuery | undefined}) => {
    const form = useForm({
        defaultValues: {
            repositoryUrl: data?.project?.repositoryUrl || '',
            repositoryToken: data?.project?.repositoryToken || ''
        },
        onSubmit: async ({value}) => {
            await fetch(`/api/projects/${data?.project.id}/add-repository`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(value)
            })
        }
    })
    
    return (
        <div className="card bg-base-200 shadow-md border border-base-200">
            <div className="card-body">
                <h2 className="card-title">Repository</h2>
                <form onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}>
                    <div className="w-full flex">
                        <form.Field name="repositoryUrl" children={(field)=> (
                                <div className="flex flex-col gap-1 w-1/2">
                                    <label className="label">
                                        <span className="label-text">URL</span>
                                    </label>
                                    <input id={field.name} name={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="input input-bordered" />
                                </div>
                            )} />
                        <form.Field name="repositoryToken" children={(field)=> (
                            <div className="flex flex-col gap-1 w-1/2">
                                <label className="label">
                                    <span className="label-text">Token</span>
                                </label>
                                <input id={field.name} type="password" name={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="input input-bordered" />
                            </div>
                        )} />
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button disabled={form.state.isSubmitting} className="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    
    )
}

const EnviromentsCard = ({ data }: {data: ProjectDetailsQuery | undefined}) => {
    const queryClient = useQueryClient()
    const form = useForm({
        defaultValues: {
            branch: '',
            type: 'docker-compose'
        },
        onSubmit: async ({value}) => {
            await fetch(`/api/projects/${data?.project.id}/deploy-branch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(value)
            })
            .then(() => {
                queryClient.invalidateQueries({
                    queryKey: ['projects', data?.project.id!]
                })
            })
        }
    })
    const navigate = useNavigate()
    return (
        <ul className="list bg-base-200 rounded-box shadow-md border border-base-200">
            <li className="p-4 text-xs tracking-wide flex justify-between items-center">
                <h2 className="card-title">
                    Setup
                </h2>
                <div>
                    <button className="btn btn-neutral" onClick={()=> (document.getElementById('my_modal_2') as HTMLDialogElement).showModal()}>
                        Up enviroment
                    </button>
                    <dialog  id="my_modal_2" className="modal">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Up enviroment</h3>
                            <div className="mt-5">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        form.handleSubmit()
                                    }}
                                >
                                    <form.Field name="branch" children={(field)=> (
                                        <div className="flex flex-col gap-1">
                                            <label className="label">
                                                <span className="label-text">Branch</span>
                                            </label>
                                            <input id={field.name} name={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="input input-bordered" />
                                        </div>
                                    )} />
                                    
                                    <div className="mt-5 flex justify-end">
                                        <button type="submit" className="btn btn-primary" disabled={form.state.isSubmitting}>
                                            <span className="loading loading-spinner" hidden={!form.state.isSubmitting}></span>
                                            Deploy
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <form method="dialog" className="modal-backdrop">
                            <button>close</button>
                        </form>
                    </dialog>
                </div>
            </li>
            {
                data?.containers?.environments?.map((env) => (
                    <li className="list-row" key={env}>
                        <div className="list-col-grow">
                            <div className="text-xs font-semibold capitalize">{env}</div>
                            <div className="flex gap-2">
                                <div className="text-xs font-semibold opacity-60">Containers</div>
                                <div className="text-xs font-semibold opacity-60 text-success">{data?.containers[env].filter(c => c.state === 'running').length} Running</div>
                                <div className="text-xs font-semibold opacity-60 text-error">{data?.containers[env].filter(c => c.state === 'exited').length} Stopped</div>
                            </div>
                        </div>
                        <button className="btn btn-square btn-ghost btn-neutral" onClick={()=>navigate(`env/${env}`)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[1.2em] lucide lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
                        </button>
                    </li>
                ))
            }
        </ul>
    )
}