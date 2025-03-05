import { useParams } from "react-router"
import { projectQuery, type ProjectContainers } from "./project-details"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const containerExecMutation = (containerIds: string[]) => {
    const { id } = useParams<{envId: string, id: string}>()
    const queryClient = useQueryClient()    
    return useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['projects', id!]
            })
        },
        mutationFn: async (command: 'restart' | 'stop' | 'up') => await fetch(`/api/${command}-containers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                containerIds
            })
        }).then(res => res.json())
    })
}

export const EnviromentDetailsPage = () => {
    const {envId, id} = useParams<{envId: string, id: string}>()
    const { data } = projectQuery(id!, true)
    const containers = useMemo(() => {
        return data?.containers[envId!]
    }, [data, envId])
    
    const { mutate, isPending } = containerExecMutation(containers?.map(container => container.id) || [])
    
    return <div>
        <div className="flex justify-between">
            <div className="flex items-center gap-2">
                <button className="btn h-8 btn-xs" onClick={()=>window.history.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h1 className="text-lg font-semibold capitalize">
                    {envId}
                </h1>
            </div>
            <div className="flex gap-2">
                <button className="btn btn-soft btn-error" disabled={isPending} onClick={()=>mutate('stop')}>Stop all</button>
                <button className="btn btn-soft btn-success" disabled={isPending} >Up all</button>
            </div>
        </div>
        <div className="card bg-base-100 card-lg shadow-lg border border-base-200 p-5 mt-5 ">
            <div className="grid grid-cols-2 gap-5">   
                {containers?.map((container) => (
                    <ContainerCard key={container.id} container={container} envId={envId!}/>
                ))}
            </div>
            <h1 className="text-lg font-semibold capitalize mt-5">
                Logs
            </h1>
            <div className="mt-3">
                <div className="tabs tabs-lift">
                    {containers?.map((container, index) => (
                        <>
                            <label className="tab">
                            <input type="radio" name="my_tabs_4" defaultChecked={index == 0} />
                                App
                            </label>
                            <div className="tab-content bg-base-100 border-base-300 p-6">
                                <ContainerLogs containerId={container.id}  state={container.state} />
                            </div>
                        </>
                    )
                    )}
                </div>
            </div>
        </div>
    </div>
}


const ContainerCard = ({container, envId}: {
    container: ProjectContainers[string][number],
    envId: string
}) => {
    const { isPending, mutate } = containerExecMutation([container.id])
    
    return (
        <div className="card bg-base-200 card-sm shadow-sm border border-base-200">
            <div className="card-body">
                <div className="flex justify-between items-center">
                    <h2 className="card-title capitalize">
                        {container.name}
                    </h2>
                    <ContainerStateBadge state={container.state} />
                </div>
                <div className="mt-3 flex flex-col gap-5">
                    <div>
                        <div className="text-xs font-semibold opacity-60">Status</div>
                        <div className="text-xs">{container.status}</div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold opacity-60">Link</div>
                        <a className="link link-info flex gap-1 items-end" target="_blank" rel="noopener noreferrer" href={`http://${envId}-${container.name}.localhost`}>http://{envId}-{container.name}.localhost
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-[1px] size-[1.2em] lucide lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
                        </a>
                    </div>
                </div>
                <div className="justify-end card-actions mt-5">
                    <button className="btn btn-error" 
                        onClick={()=>mutate('stop')}
                        disabled={container.state != "running" || isPending}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-pause"><circle cx="12" cy="12" r="10"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>
                        Stop
                    </button>
                    <button className="btn btn-soft" 
                    onClick={()=>mutate('restart')}
                    disabled={container.state != "running" || isPending}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                        Restart
                    </button>
                    <button className="btn btn-success " 
                    onClick={()=>mutate('up')}
                    disabled={container.state == "running" || isPending}>Up</button>
                </div>
            </div>
        </div>
    )
}

const ContainerStateBadge = ({state}: {state: string}) => {
    if(state === 'running'){
        return <div className="badge badge-success text-white text-xs font-semibold">
            <svg className="size-[1em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeLinecap="square" stroke-miterlimit="10" strokeWidth="2"></circle><polyline points="7 13 10 16 17 8" fill="none" stroke="currentColor" strokeLinecap="square" stroke-miterlimit="10" strokeWidth="2"></polyline></g></svg>
            Running
        </div>
    }
    return <div className="badge badge-error text-white text-xs font-semibold">
        <svg className="size-[1em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M3 3l18 18M21 3L3 21"></path></g></svg>
        Stopped
    </div>
}

type ContainerLog = {
    msg: string
    level: number
}


const ContainerLogs = (props: {
    containerId: string,
    state: string
}) => {
    const [logs, setLogs] = useState<ContainerLog[]>([])
    const [sse, setSse] = useState<EventSource | null>(null)

    useEffect(() => {
        const container = document.getElementById('logs-container')
        if(!props.containerId) return
        if(props.state !== 'running' && sse){ 
            sse?.close()
            setSse(null)
            setLogs([{ msg: `Container ${props.state}`, level: 20 }])
            return
        } if(props.state === 'running') {
            const _sse = new EventSource('/api/container-logs/' + props.containerId)
            _sse.onmessage = (event) => {
                const data = event.data
                const result: ContainerLog[] = []
                if(data.startsWith('{') && data.endsWith('}')){
                    const log = JSON.parse(data) as { logs: ContainerLog[] }
                    result.push(...log.logs)
                } else {
                    result.push({ msg: data, level: 0 })
                }
                setLogs((prev) => [...prev, ...result])
    
                container?.scrollTo(0, container.scrollHeight)
            }
            _sse.onerror = () => {
                setLogs([{ msg: 'Connection error', level: 20 }])
            }
            setSse(_sse)
            return () => {
                _sse.close()
            }
        }
    }
    , [props.containerId, props.state])

    return (
        <div className="mockup-code max-w-full mt-2 max-h-[400px] overflow-auto" id="logs-container">
            {logs.map((log, index) => (
                <pre key={index} data-prefix={log.level === 0 ? '$' : log.level === 10 ? '>' : log.level === 20 ? '!' : undefined}
                    className={log.level === 0 ? 'text-success' : undefined}
                >
                    <code>{log.msg}</code>
                </pre>
            ))}
        </div>
    )
}