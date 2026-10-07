import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Students from './pages/Students.jsx'
import PostProject from './pages/PostProject.jsx'
import ProjectMatches from './pages/ProjectMatches.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import Certificate from './pages/Certificate.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="post" element={<PostProject />} />
          <Route path="projects/:id" element={<ProjectMatches />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="certificate/:id" element={<Certificate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
