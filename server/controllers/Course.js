const Course=require('../models/Course');
const Category = require('../models/Category');
const User=require('../models/User');
const {uploadImageToCloudinary}=require('../utils/imageUploader');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const { convertSecondsToDuration } = require('../utils/secToDuration');
const CourseProgress=require('../models/CourseProgress');

// createCourse handler function
exports.createCourse=async(req, res)=>{
    try{
        // fetch data
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            category,
            status,
            price,
            tag,
            instructions
        }=req.body;

        // get thumbnail
        const thumbnail=req.files.thumbnailImage;

        // validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !category || !price || !tag || !thumbnail || !instructions){
            return res.status(400).json({
                success:false,
                message:'All fields are required'
            })
        }

        if(!status || status===undefined || status===null){
            status='Draft';
        }

        // check for instructor
        const userId=req.user.id;
        const instructorDetails=await User.findById(userId,{
            accountType:'Instructor'
        });
        // console.log('Instructor Detail:', instructorDetails);
        // TODO: verify that userId and instructorDetails._Id are same or different

        if(!instructorDetails){
            return res.status(400).json({
                success:false,
                message:'Instructor Details not found'
            })
        }

        // check given category is valid or not
        const categoryDetails=await Category.findById(category);
        if(!categoryDetails){
            return res.status(400).json({
                success:false,
                message:'Category Details not found'
            })
        }

        // upload image to cloudinary
        const thumbnailImage=await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // console.log(thumbnailImage);

        // create an entry for new Course
        const newCourse=await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price,
            category:categoryDetails._id,
            tag:tag,
            thumbnail:thumbnailImage.secure_url,
            instructions,
            status
        })
        // add the new course to the user schema of Instructor
        await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id
                }
            },
            {new:true}
        );

        // Add the new course to the Categories
        await Category.findByIdAndUpdate(
            {_id:category},
            {
                $push:{
                    courses:newCourse._id
                }
            },
            {new:true}
        );

        // return the response
        return res.status(200).json({
            success:true,
            messgae:'Course created successfully',
            data:newCourse
        })
    }catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to create Course',
            error:error.message
        })
    }
}

// edit course
exports.editCourse=async (req, res)=>{
    try{
        const {courseId}=req.body
        const updates=req.body
        const course=await Course.findById(courseId)

        if(!course){
            return res.status(404).json({
                error:'Course not found'
            })
        }

        // if thumbnail image is found, update it
        if(req.files){
            console.log('thumbnail update')
            const thumbnail=req.files.thumbnailImage
            const thumbnailImage=await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
            )
            course.thumbnail=thumbnailImage.secure_url
        }

        // update only the fields that are present in request body
        for(const key in updates){
            if(updates.hasOwnProperty(key)){
                if(key==="tag" || key==="instructions"){
                    course[key]=JSON.parse(updates[key])
                }else{
                    course[key]=updates[key]
                }
            }
        }

        await course.save()

        const updatedCourse=await Course.findOne({
            _id: courseId
        })
        .populate({
            path:'instructor',
            populate:{
                path:'additionalDetails'
            }
        })
        .populate('category')
        .populate('ratingAndReviews')
        .populate({
            path:'courseContent',
            populate:{
                path:'subSection'
            }
        })
        .exec()

        res.json({
            success:true,
            message:'Course updated successfully',
            data:updatedCourse
        })
    }catch(error){
        console.error(error)
        res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message
        })
    }
}


// getAllcources handler function
exports.getAllCourses=async(req, res)=>{
    try{
        // TODO: change the below statement incremetally
        const allCourses=await Course.find(
            {status:"Published"},
            {
                courseName: true,
				price: true,
				thumbnail: true,
				instructor: true,
				ratingAndReviews: true,
				studentsEnroled: true,
            }).populate('instructor').exec();

        return res.status(200).json({
            success:true,
            message:'All courses fetched successfully',
            data:allCourses
        })
    }catch(error){
        console.log(error)
        return res.status(404).json({
            success:false,
            message:'Cannot fetch course data',
            error:error.message
        })
    }
}

// get single CourseDetails
exports.getCourseDetails=async (req, res)=>{
    try{
        // get id
        const {courseId}=req.body;
        // find course details
        const courseDetails = await Course.findOne({
            _id: courseId,
          })
            .populate({
              path: "instructor",
              populate: {
                path: "additionalDetails",
              },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
              path: "courseContent",
              populate: {
                path: "subSection",
                select: "-videoUrl",
              },
            })
            .exec()

        // validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course with ${courseId}`
            })
        }

        let totalDurationInSeconds=0
        courseDetails.courseContent.forEach((content)=>{
            content.subSection.forEach((subSection)=>{
                const timeDurationInSeconds=parseInt(subSection.timeDuration)
                totalDurationInSeconds+=timeDurationInSeconds
            })
        })

        const totalDuration=convertSecondsToDuration(totalDurationInSeconds)

        // return response
        return res.status(200).json({
            success:true,
            message:'Course details fetched successfully',
            data:{
                courseDetails,
                totalDuration
            }
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.getFullCourseDetails=async(req, res)=>{
    try{
        const {courseId}=req.body
        const userId=req.user.id
        const courseDetails = await Course.findOne({
            _id: courseId,
          })
            .populate({
              path: "instructor",
              populate: {
                path: "additionalDetails",
              },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
              path: "courseContent",
              populate: {
                path: "subSection",
              },
            })
            .exec()

        let courseProgressCount=await CourseProgress.findOne({
            courseId:courseId,
            userId:userId
        })

        console.log("courseProgressCount : ", courseProgressCount)

        if (!courseDetails) {
            return res.status(400).json({
              success: false,
              message: `Could not find course with id: ${courseId}`,
            })
          }


          let totalDurationInSeconds = 0
          courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
              const timeDurationInSeconds = parseInt(subSection.timeDuration)
              totalDurationInSeconds += timeDurationInSeconds
            })
          })
      
          const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
      
          return res.status(200).json({
            success: true,
            data: {
              courseDetails,
              totalDuration,
              completedVideos: courseProgressCount?.completedVideos
                ? courseProgressCount?.completedVideos
                : [],
            },
          })

    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// get a list of course for a given instructor
exports.getInstructorCourses=async(req, res)=>{
    try{
        // get the instructor Id from the authenticated user or request body
        const instructorId=req.user.id

        // find all courses belonging to the instructor
        const instructorCourses=await Course.find({
            instructor:instructorId
        }).sort({createdAt:-1})

        // return the instructor's courses
        res.status(200).json({
            success:true,
            data:instructorCourses
        })
    }catch(error){
        console.error(error)
        res.status(500).json({
            success:false,
            message:'Failed to retrieve instructor courses',
            error:error.message
        })
    }
}

// delete a course
exports.deleteCourse=async(req, res)=>{
    try{
        const {courseId}=req.body

        // find the course
        const course=await Course.findById(courseId)
        if(!course){
            return res.status(404).json({
                message:'Course not found'
            })
        }

        // Unenroll students from the course
        const studentsEnrolled=course.studentsEnrolled
        for (const studentId of studentsEnrolled){
            await User.findByIdAndUpdate(studentId, {
                $pull:{
                    courses:courseId
                }
            })
        }

        // delete sections and sub-sections
        const courseSections=course.courseContent
        for(const sectionId of courseSections){
            // delete subsection of the section
            const section=await Section.findById(sectionId)
            if(section){
                const subSections=section.subSection
                for(const subSectionId of subSections){
                    // delete subsection
                    await SubSection.findByIdAndDelete(subSectionId)
                }
            }
            // delete the section
            await Section.findByIdAndDelete(sectionId)
        }

        // delete the course
        await Course.findByIdAndDelete(courseId)

        // find the category of course
        const categoryId=course.category
        // remove course from category list
        await Category.findByIdAndUpdate(categoryId,{
            $pull:{
                courses:courseId
            }
        })

        // remove the course Id from instructor courses
        const instructorId=course.instructor
        // remove course id from instructor modal i.e., User modal
        await User.findByIdAndUpdate(instructorId,{
            $pull:{
                courses:courseId
            }
        })

        return res.status(200).json({
            success:true,
            message:'Course Deleted Successfully'
        })
    }catch(error){
        console.error(error)
        return res.status(500).json({
            success:false,
            message:'Server error',
            error:error.message
        })
    }
}