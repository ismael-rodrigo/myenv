import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"

const projectsQuery = () => useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
        const response = await fetch('/api/projects/list')
        return response.json() as Promise<{ id: string, name: string }[]>
    }
})


export function ProjectsPage() {
    const { data } = projectsQuery()
    const navigate = useNavigate()
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Projetos</h1>
                <button className="btn btn-neutral" onClick={()=>navigate('/projects/create')}>Criar projeto</button>
            </div>
            {data?.map((project) => (
                <div className="card w-96 bg-base-100 card-sm shadow-sm border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title capitalize">{project.name}</h2>
                        <div className="justify-end card-actions">
                            <button className="btn btn-soft btn-primary" onClick={()=>navigate(project.id)}>Detalhes</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}