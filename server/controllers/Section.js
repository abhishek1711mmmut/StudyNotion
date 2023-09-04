const Section=require('../models/Section');
const Course=require('../models/Course');
const SubSection = require('../models/SubSection');

exports.createSection=async (req, res)=>{
    try{
        // data fetch
        const {sectionName, courseId}=req.body;
        // data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:'Missing required Properties'
            });
        }
        // create section
        const newSection=await Section.create({sectionName});
        // update course with section ObjectId
        const updatedCourseDetails=await Course.findByIdAndUpdate(courseId,
            {
                $push:{
                    courseContent:newSection._id
                }
            },
            {new:true}
        )
        .populate({
            path:'courseContent',
            polulate:{
                path:'subSection'
            }
        })
        .exec();
        // check working or not,  await Course.find().polulate({path:'courseContent.subSection.'})
        // return response
        return res.status(200).json({
            success:true,
            message:'Section created successfully',
            updatedCourseDetails
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'Unable to create section, please try again',
            error:error.message
        })
    }
}

// UPDATE a section
exports.updateSection=async (req, res)=>{
    try{
        // data input
        const {sectionName, sectionId, courseId}=req.body;
        // data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:'Missing Properties'
            });
        }
        // update data
        const section=await Section.findByIdAndUpdate(sectionId,{sectionName}, {new:true})

        const course=await Course.findById(courseId)
        .populate({
            path:'courseContent',
            populate:{
                path:'subSection'
            }
        })
        // return res
        return res.status(200).json({
            success:true,
            message:section,
            data:course
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'Unable to update section, please try again',
            error:error.message
        })
    }
}

exports.deleteSection=async (req, res)=>{
    try{
        // get id- assuming that we are sending in params
        const {sectionId, courseId}=req.body;
        // const {sectionId}=req.params;  // for testing purpose
        // use findByIdAndDelete
        // find section for validation
        const section=await Section.findById(sectionId);
        if(!section){
            return res.status(404).json({
                success:false,
                message:'Section not found'
            })
        }
        // delete subSection inside that section
        await SubSection.deleteMany({
            _id:{
                $in:section.subSection
            }
        })
        
        // we need to delete the entry from the course schema
        await Course.findByIdAndUpdate({_id:courseId},
            {
                $pull:{
                    courseContent:sectionId
                }
            })

        // delete section
        await Section.findByIdAndDelete(sectionId);

        //find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();
            
        // return response
        return res.status(200).json({
            success:true,
            message:'Section deleted successfully',
            data:course
        })
    }catch(error){
        console.error("Error deleting section:", error);
        return res.status(500).json({
            success:false,
            message:'Unable to delete section, please try again',
            error:error.message
        })
    }
}