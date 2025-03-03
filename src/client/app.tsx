import { BrowserRouter, Routes } from 'react-router'
import './global.css'
import { Route,  } from 'react-router'
import { ProjectsPage } from './pages/projects'

export function App () {
  return (
    <BrowserRouter >
      <Routes >
          <Route index element={<ProjectsPage />}    />
      </Routes>
    </BrowserRouter>
  )
}