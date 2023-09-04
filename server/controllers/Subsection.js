const SubSection=require('../models/SubSection');
const Section=require('../models/Section');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

// create SubSection

exports.createSubSection=async (req, res)=>{
    try{
        // fetch data from req body
        const {sectionId, title, description}=req.body;
        // extract file/video
        const video=req.files.video;
        // validation
        if(!sectionId || !title || !description || !video){
            return res.status(404).json({
                success:false,
                message:'All fields are required'
            });
        }
        // upload video to cloudinary
        const uploadDetails=await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        // create a subsection
        const SubSectionDetails=await SubSection.create({
            title:title,
            timeDuration:`${uploadDetails.duration}`,
            description:description,
            videoUrl:uploadDetails.secure_url
        })
        // Update the corresponding section with the newly created sub-section
        const updatedSection=await Section.findByIdAndUpdate({_id:sectionId},
            {
                $push:{
                    subSection:SubSectionDetails._id
                }
            }, {new:true}).populate('subSection').exec();
        // return response
        return res.status(200).json({
            success:true,
            message:'Sub Section created successfully',
            data:updatedSection
        })
    }catch(error){
        console.error("Error creating new sub-section:", error)
        return res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message
        })
    }
}

// hw: updateSubSection
exports.updateSubSection=async (req, res)=>{
    try{
        // fetch data from req body
        const {subSectionId, sectionId, title, description}=req.body;
        const subSection = await SubSection.findById(subSectionId)
  
        if (!subSection) {
            return res.status(404).json({
            success: false,
            message: "SubSection not found",
            })
        }

        if (title !== undefined) {
            subSection.title = title
        }
    
        if (description !== undefined) {
            subSection.description = description
        }

        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
              video,
              process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }
        await subSection.save()

        // const updatedSubSection=await SubSection.findById(subSectionId);
        const updatedSection=await Section.findById(sectionId).populate('subSection').exec();
  
        return res.json({
            success: true,
            data:updatedSection,
            message: "Section updated successfully",
        })
    }catch(error){
        console.error("Error in updating subSection ",error)
        return res.status(500).json({
            success:false,
            message:'Unable to update subSection, please try again',
            error:error.message
        })
    }
}

// delete subSection
exports.deleteSubSection=async (req, res)=>{
    try{
        // get id- assuming that we are sending in params
        const { subSectionId, sectionId } = req.body
        
        await Section.findByIdAndUpdate({_id:sectionId},
            {
                $pull:{
                    subSection:subSectionId
                }
            });

        // use findByIdAndDelete
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
              .status(404)
              .json({ success: false, message: "SubSection not found" })
        }

        const updatedSection=await Section.findById(sectionId).populate('subSection').exec();

        // return response
        return res.status(200).json({
            success:true,
            data:updatedSection,
            message:'SubSection deleted successfully'
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'Unable to delete subSection, please try again',
            error:error.message
        })
    }
}