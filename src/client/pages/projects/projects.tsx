import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
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
            {data?.map((project) => (
                <div className="card w-96 bg-base-100 card-sm shadow-sm border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title capitalize">{project.name}</h2>
                        <div className="justify-end card-actions">
                            <button className="btn btn-soft btn-primary" onClick={()=>navigate(project.id)}>Details</button>
                        </div>
                    </div>
                </div>
            ))}
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
