import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, FreeMode } from 'swiper/modules'
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

import CourseCard from './CourseCard';

const CourseSlider = ({Courses}) => {
  return (
    <>
        {
            Courses?.length ? (
                <Swiper
                slidesPerView={1}
                spaceBetween={25}
                loop={true}
                modules={[FreeMode, Pagination]}
                breakpoints={{
                    1024:{
                        slidesPerView:3,
                    }
                }}
                className="max-h-[30rem]"
                >
                    {
                        Courses?.map((course, index)=>(
                            <SwiperSlide key={index}>
                                <CourseCard course={course} Height={"h-[250px]"}/>
                            </SwiperSlide>
                        ))
                    }
                </Swiper>
            ) : (
                <p className='text-xl text-richblack-5'>
                    No Course Found
                </p>
            )
        }
    </>
  )
}

export default CourseSlider