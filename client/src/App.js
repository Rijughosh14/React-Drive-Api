import React from 'react'
import { Routes, Route } from "react-router-dom";
import axios from 'axios'
import Index from './pages/Index';
import { File } from './pages/File';



axios.defaults.baseURL = 'http://localhost:3001/api'



export const App = () => {
  return (
    <>
    <Routes>
      <Route  exact path='/' element={<Index/>}/>
      <Route  exact path='/file' element={<File/>}/>
    </Routes>
    </>
  )
}
