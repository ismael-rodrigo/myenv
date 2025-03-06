import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"

const projectsQuery = () => useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
        const response = await fetch('/api/projects/list')
        return response.json() as Promise<{ id: string, name: string, repositoryUrl: string }[]>
    }
})

export function ProjectsPage() {
    const { data } = projectsQuery()
    const navigate = useNavigate()

    const form = useForm({
        defaultValues: {
            name: ''
        },
        onSubmit({ value, formApi }){
            fetch('/api/projects/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(value)
            }).then(r => r.json()).then((result) => {
                formApi.reset();
                (document.getElementById('my_modal_2') as HTMLDialogElement).close()
                navigate(result.id)
            })
        }
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Projects</h1>
                <button className="btn btn-neutral" onClick={()=>{
                    (document.getElementById('my_modal_2') as HTMLDialogElement).showModal()
                }}>New Project</button>
            </div>
            <div className="flex flex-wrap gap-4">
                {data?.map((project) => (
                    <div className="card w-72 bg-base-100 card-sm shadow-sm border border-base-200 hover:bg- cursor-pointer" key={project.id} onClick={()=>navigate(project.id)}>
                        <div className="card-body ">
                            <h2 className="card-title capitalize">{project.name}</h2>
                            <div className="badge badge-neutral opacity-65">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                                {project.repositoryUrl.replace('https://github.com/', "")}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <dialog  id="my_modal_2" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">New Project</h3>
                    <div className="mt-5">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                form.handleSubmit()
                            }}
                        >
                            <form.Field name="name" children={(field)=> (
                                <div className="flex flex-col gap-1">
                                    <label className="label">
                                        <span className="label-text">Name</span>
                                    </label>
                                    <input id={field.name} name={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="input input-bordered" />
                                </div>
                            )} />
                            <div className="mt-5 flex justify-end">
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    )
}
