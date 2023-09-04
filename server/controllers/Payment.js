const {instance}=require('../config/razorpay');
const Course=require('../models/Course');
const User=require('../models/User');
const mailSender=require('../utils/mailSender');
const {courseEnrollmentEmail}=require('../mail/templates/courseEnrollmentEmail');
const { default: mongoose } = require('mongoose');
const crypto=require('crypto');
const { paymentSuccessEmail } = require('../mail/templates/paymentSuccessEmail');
const CourseProgress = require('../models/CourseProgress');

// DOCUMENTATION UTL: https://razorpay.com/docs/partners/aggregators/partner-auth/payment-gateway/

// Capture the payment and initiate the razorpay order
exports.capturePayment=async(req, res)=>{

    const {courses}=req.body;
    const userId=req.user.id;

    if(courses.length===0){
        return res.json({
            success:false,
            message:'Please Provide course ID'
        })
    }

    let totalAmount=0;

    // calculate total amount of all courses
    for(const course_id of courses){
        let course;
        try{
            course=await Course.findById(course_id);
            if(!course){
                return res.status(200).json({
                    success:false,
                    message:'Could not find the course'
                })
            }

            const uid=new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:'Student is already Enrolled'
                })
            }

            totalAmount+=course.price;
        }catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message
            })
        }
    }

    const options={
        amount: totalAmount * 100,
        currency: "INR",
        receipt:Math.random(Date.now()).toString()
    }

    try {
        const paymentResponse=await instance.orders.create(options);
        res.status(200).json({
            success:true,
            data:paymentResponse
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Could not Initiate Order"
        })
    }

}

// verify the payment
exports.verifyPayment=async(req, res)=>{
    const razorpay_order_id=req.body?.razorpay_order_id;
    const razorpay_payment_id=req.body?.razorpay_payment_id;
    const razorpay_signature=req.body?.razorpay_signature;
    const courses=req.body?.courses;
    const userId=req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId){
            return res.status(200).json({
                success:false,
                message:"Payment Failed"
            })
        }

        let body=razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature=crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest("hex");

            if(expectedSignature===razorpay_signature){
                // enroll the student
                await enrollStudents(courses, userId, res)
                // return response
                return res.status(200).json({
                    success:true,
                    message:"Payment Verified"
                })
            }

    return res.status(200),json({
        success:false,
        message:"Payment Failed"
    })
}

const enrollStudents=async(courses, userId, res)=>{

    if(!courses || !userId){
        return res.status(400).json({
            success:false,
            message:"Please provide data for Courses or UserId"
        })
    }

    for(const courseId of courses){
        try {
            // find the course and enroll the student in it
            const enrolledCourse=await Course.findOneAndUpdate(
                {_id:courseId},
                {$push:{studentsEnrolled:userId}},
                {new:true}
            )

            if(!enrolledCourse){
                return res.status(500).json({
                    success:false, 
                    message:"Course not Found"
                });
            }
            console.log("Updated course: ", enrolledCourse)

            const courseProgress=await CourseProgress.create({
                courseId:courseId,
                userId:userId,
                completedVideos:[]
            })

            // find the student and add the course to their list of enrolledCourses
            const enrolledStudent=await User.findByIdAndUpdate(userId,
                {$push:{
                    courses:courseId,
                    courseProgress:courseProgress._id
                }},
                {new:true}
                )

            // send mail to student
            const emailResponse=await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, 
                `${enrolledStudent.firstName} ${enrolledStudent.lastName}`)
            )
            console.log("Email sent successfully", emailResponse);
        } catch (error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message})
        }
    }

}

exports.sendPaymentSuccessEmail=async(req, res)=>{
    const {orderId, paymentId, amount}=req.body;
    const userId=req.user.id;
    if(!orderId || !paymentId || !amount || !userId){
        return res.status(400).json({
            success:false, 
            message:"Please provide all the fields"
        });
    }

    try{
        // student ko dhundo
        const enrolledStudent=await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            "Payment Received",
            paymentSuccessEmail(
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
            amount/100,
            orderId,
            paymentId
            )
        )
    }catch(error){
        console.log("Error in sending email", error);
        return res.status(500).json({
            success:false,
            message:"Could not send email"
        })
    }
}






// //capture the payment and initiate the Razorpay order
// exports.capturePayment=async (req, res)=>{
//     // get courseId and UserId
//     const {course_id}=req.body;
//     const userId=req.user.body;
//     // validation
//     // valid courseId
//     if(!course_id){
//         return res.json({
//             success:false,
//             message:'Please provide valid course ID'
//         })
//     }
//     // valid courseDetail
//     let course;
//     try{
//         course=await Course.findById(course_id);
//         if(!course){
//             return res.json({
//                 success:false,
//                 message:'Could not find the course'
//             });
//         }
//         // user already pay for the same course
//         const uid=new mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)){
//             return res.status(200).json({
//                 success:false,
//                 message:'Student is already enrolled'
//             })
//         }
//     }catch(error){
//         console.error(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message
//         });
//     }
    
//     // order create
//     const amount=course.price;
//     const currency='INR';
//     const options={
//         amount:amount*100,
//         currency,
//         receipt:Math.random(Date.now()).toString(),
//         notes:{
//             courseID:course_id,
//             userId,
//         }
//     };

//     try{
//         // initiate the payment using razorpay
//         const paymentResponse=await instance.orders.create(options);
//         console.log(paymentResponse);
//         // return response
//         return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail:course.thumbnail,
//             orderId:paymentResponse.id,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount
//         })
//     }catch(error){
//         console.log(error);
//         res.json({
//             success:false,
//             message:'Could not initiate order'
//         })
//     }
// }

// // verify signature of razorpay and server
// exports.verifySignature= async (req, res)=>{
//     const webhookSecret='12345678';
//     const signature=req.header['x-razorpay-signature'];

//     const shasum=crypto.createHmac('sha256', webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest=shasum.digest('hex');  // digest is term used for the o/p of hashing algorithm

//     // match webhook and signature
//     if(signature===digest){
//         console.log('Payment is Authorised');

//         const {courseId, userId}=req.body.payload.payment.entity.notes;

//         try{
//             // fullfill the action

//             // find the course and enroll the student in it
//             const enrolledCourse=await Course.findOneAndUpdate(
//                                                 {_id:courseId},
//                                                 {
//                                                     $push:{
//                                                         studentsEnrolled:userId
//                                                     }
//                                                 },{new:true});
//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:'Course not found'
//                 })
//             }

//             console.log(enrolledCourse);
//             // find the student and add the course to their list of enrolled courses
//             const enrolledStudent=await User.findOneAndUpdate(
//                                         {_id:userId},
//                                         {$push:{courses:courseId}},
//                                         {new:true});

//             console.log(enrolledStudent);
//             const emailResponse=await mailSender(
//                 enrolledStudent.email,
//                 'Congratulations from StudyNotion',
//                 'Congratulations, you are onboarded into new StudyNotion Course'
//             );
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:'Signature verified and course added'
//             })
//         }catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message
//             })
//         }
//     }
//     else{
//         return res.status(400).json({
//             success:fale,
//             message:'Invalid request'
//         })
//     }
// }