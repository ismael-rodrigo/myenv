import { BrowserRouter, Navigate, Routes } from 'react-router'
import './global.css'
import { Route,  } from 'react-router'
import { ProjectsPage } from './pages/projects/projects'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoggedLayout } from './layout/logged-layout'
import { ProjectDetailsPage } from './pages/projects/project-details'
import { EnviromentDetailsPage } from './pages/projects/enviroment-details'

export function App () {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter >
        <Routes>
            <Route path='/' element={<Navigate to="projects" />} />
            <Route element={<LoggedLayout />}>
              <Route path='projects' element={<ProjectsPage />} index/>
              <Route path='projects/:id' element={<ProjectDetailsPage/>} />
              <Route path='projects/:id/env/:envId' element={<EnviromentDetailsPage/>} />
            </Route>
            <Route path="*" element={<Navigate to="/projects" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}