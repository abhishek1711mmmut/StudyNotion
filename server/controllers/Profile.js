const Course = require('../models/Course');
const CourseProgress = require('../models/CourseProgress');
const Profile=require('../models/Profile');
const User=require('../models/User');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
const { convertSecondsToDuration } = require('../utils/secToDuration');

exports.updateProfile=async(req, res)=>{
    try{
        // get data
        const {firstName='', lastName='',dateOfBirth='', about='', contactNumber='', gender=''}=req.body;   
        // get userId
        const id=req.user.id;

        // find profile
        const userDetails=await User.findById(id);
        const profileId=userDetails.additionalDetails;
        const profileDetails=await Profile.findById(profileId);

        userDetails.firstName=firstName;
        userDetails.lastName=lastName;
        await userDetails.save();

        // update the profile fields
        profileDetails.dateOfBirth=dateOfBirth;
        profileDetails.about=about;
        profileDetails.gender=gender;
        profileDetails.contactNumber=contactNumber;

        await profileDetails.save();

        const updatedUserDetails=await User.findById(id)
            .populate('additionalDetails')
            .exec()

        // return response
        return res.status(200).json({
            success:true,
            message:'Profile updated successfully',
            updatedUserDetails
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            error:error.message
        });
    }
}


// update profile pic
exports.updateDisplayPicture=async(req, res)=>{
    try{
        const displayPicture=req.files.displayPicture;
        const userId=req.user.id;
        const image=await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )
        console.log(image)
        const updatedProfile=await User.findByIdAndUpdate(
            {_id:userId},
            {image:image.secure_url},
            {new:true}
        )
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedProfile,
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


// get all enrolled courses list of that user
exports.getEnrolledCourses=async(req, res)=>{
    try{
        // get id
        const userId=req.user.id;
        // validation and get user details
        let userDetails=await User.findById(userId).populate({
            path:'courses',
            populate:{
                path:'courseContent',
                populate:{
                    path:'subSection'
                }
            }
        }).exec();

        userDetails=userDetails.toObject();
        var SubsectionLength=0;
        for(var i=0; i<userDetails.courses.length; i++){
            let totalDurationInSeconds=0;
            SubsectionLength=0;
            for(var j=0;j<userDetails.courses[i].courseContent.length;j++){
                totalDurationInSeconds+=userDetails.courses[i].courseContent[j].subSection.reduce((acc, curr)=>acc+parseInt(curr.timeDuration),0);
                userDetails.courses[i].totalDuration=convertSecondsToDuration(totalDurationInSeconds);
                SubsectionLength+=userDetails.courses[i].courseContent[j].subSection.length;
            }
            let courseProgressCount=await CourseProgress.findOne({
                courseId:userDetails.courses[i]._id,
                userId:userId
            })
            courseProgressCount=courseProgressCount?.completedVideos.length;
            if(SubsectionLength===0){
                userDetails.courses[i].progressPercentage=100
            }else{
                // To make it up to 2 decimal point
                const multiplier=Math.pow(10,2);
                userDetails.courses[i].progressPercentage=Math.round(
                    (courseProgressCount / SubsectionLength) * 100 * multiplier
                ) / multiplier
            }
        }

        if (!userDetails) {
            return res.status(400).json({
              success: false,
              message: `Could not find user with id: ${userDetails}`,
            })
        }
        // return response
        return res.status(200).json({
            success:true,
            data:userDetails.courses
        });
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

// get all user details
exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// delete account
exports.deleteAccount=async(req,res)=>{
    try{
        // get id
        const id=req.user.id;
        // validation
        const userDetails=await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:'User not found'
            })
        }
        // delete profile
        await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});
        
        // hw: unenrolled user from all enrolled course , explore cron job, how can we schedule this task
        await Course.updateMany(
            {},
            {
                $pull:{
                    studentsEnrolled:id
                }
            }
        );
        // delete user
        await User.findByIdAndDelete({_id:id});
        // return response
        return res.status(200).json({
            success:true,
            message:'User deleted successfully'
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:'Unable to delete user, please try again'
        });
    }
};

// instructor dashboard
exports.instructorDashboard=async(req, res)=>{
    try {
        const courseDetails=await Course.find({instructor:req.user.id});

        const courseData=courseDetails.map((course)=>{
            const totalStudentsEnrolled=course.studentsEnrolled.length
            const totalAmountGenerated=totalStudentsEnrolled * course.price

            // create a new object with additional fields
            const courseDataWithStats={
                _id:course._id,
                courseName:course.courseName,
                courseDescription:course.courseDescription,
                totalStudentsEnrolled,
                totalAmountGenerated
            }
            return courseDataWithStats
        })
        res.status(200).json({
            success:true,
            courses:courseData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}