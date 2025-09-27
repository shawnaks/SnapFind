import { Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import AppLayout from './layouts/AppLayout'
import PostFound from './pages/PostFound'
import PostLost from './pages/PostLost'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/post-found" element={<PostFound />} />
        <Route path="/post-lost" element={<PostLost />} />
      </Route>
    </Routes>
  )
}
