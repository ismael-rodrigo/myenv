import { useParams } from "react-router"
import { projectQuery } from "./project-details"
import { useMemo } from "react"

export const EnviromentDetailsPage = () => {
    const {envId, id} = useParams<{envId: string, id: string}>()
    const { data } = projectQuery(id!, true)

    const containers = useMemo(() => {
        return data?.containers[envId!]
    }, [data, envId])


    return <div>
        <div className="flex items-center gap-2">
            <button className="btn h-8 btn-xs" onClick={()=>window.history.back()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="text-lg font-semibold capitalize">
                {envId}
            </h1>
        </div>
        <div className="mt-5">   
            {containers?.map((container) => (
                <div className="card w-96 bg-base-100 card-sm shadow-sm border border-base-200">
                    <div className="card-body">
                        <div className="flex justify-between items-center">
                            <h2 className="card-title capitalize">
                                {container.name}
                            </h2>
                            <ContainerStateBadge state={container.state} />
                        </div>
                        <div className="mt-3 flex gap-5">
                            <div className="w-1/2">
                                <div className="text-xs font-semibold opacity-60">Status</div>
                                <div className="text-xs">{container.status}</div>
                            </div>
                            <div className="w-1/2">
                                <div className="text-xs font-semibold opacity-60">Link</div>
                                <a className="link link-info flex gap-1 items-end">http://{container.name}.localhost
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-[1px] size-[1.2em] lucide lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
                                </a>
                            </div>
                        </div>
                        <div className="justify-end card-actions mt-5">
                            <button className="btn btn-error">
                                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-pause"><circle cx="12" cy="12" r="10"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/></svg>                                Stop
                            </button>
                            <button className="btn btn-success " disabled={true}>Deploy</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
}

const ContainerStateBadge = ({state}: {state: string}) => {
    if(state === 'running'){
        return <div className="badge badge-success text-white text-xs font-semibold">
            <svg className="size-[1em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeLinecap="square" stroke-miterlimit="10" strokeWidth="2"></circle><polyline points="7 13 10 16 17 8" fill="none" stroke="currentColor" strokeLinecap="square" stroke-miterlimit="10" strokeWidth="2"></polyline></g></svg>
            Rodando
        </div>
    }
    return <div className="badge badge-error text-white text-xs font-semibold">
        <svg className="size-[1em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M3 3l18 18M21 3L3 21"></path></g></svg>
        Parado
    </div>
}