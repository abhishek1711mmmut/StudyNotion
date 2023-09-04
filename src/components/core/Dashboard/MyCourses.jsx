import React from 'react'
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { fetchInstructorCourses } from '../../../services/operations/courseDetailsAPI';
import IconBtn from '../../common/IconBtn';
import CoursesTable from './InstructorCourses/CoursesTable';
import { VscAdd } from "react-icons/vsc";

const MyCourses = () => {

    const {token}=useSelector((state)=>state.auth);
    const [courses, setCourses]=useState([]);
    const navigate=useNavigate();

    useEffect(()=>{
        const fetchCourses=async()=>{
            const result=await fetchInstructorCourses(token);
            if(result){
                setCourses(result);
            }
        }
        fetchCourses();
    },[])
    
  return (
    <div>
        <div className='mb-14 flex items-center justify-between'>
            <h1 className="text-3xl font-medium text-richblack-5">
                My Courses
            </h1>
            <IconBtn 
                text="Add Course"
                onClick={()=>navigate("/dashboard/add-course")}
            >
                <VscAdd/>
            </IconBtn>
        </div>
        {courses && <CoursesTable courses={courses} setCourses={setCourses}/>}
    </div>
  )
}

export default MyCourses