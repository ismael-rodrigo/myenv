import { useQuery } from "@tanstack/react-query"

const projectsQuery = () => useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
        const response = await fetch('/api/projects/list')
        return response.json()
    }
})


export function ProjectsPage() {
    const { data } = projectsQuery()
    return (
        <div className="px-8 py-4">
            {data?.map((project) => (
                <div className="card w-96 bg-base-100 card-sm shadow-sm border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title">{project.name}</h2>
                        <div className="badge badge-info">3 ambientes rodando</div>
                        <div className="justify-end card-actions">
                            <button className="btn btn-primary">Detalhes</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}