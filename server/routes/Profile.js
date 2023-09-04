const express = require("express")
const router = express.Router()

const {auth, isInstructor}=require('../middlewares/auth')
const {
    updateProfile,
    deleteAccount,
    getAllUserDetails,
    updateDisplayPicture,
    getEnrolledCourses,
    instructorDashboard
}=require('../controllers/Profile')

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************

// Delete user account
router.delete('/deleteProfile',auth, deleteAccount);
router.put('/updateProfile', auth, updateProfile);
router.get('/getUserDetails', auth, getAllUserDetails);
// Get Enrolled Courses
router.get('/getEnrolledCourses', auth, getEnrolledCourses);
router.put('/updateDisplayPicture', auth, updateDisplayPicture);
// instructor dashboard
router.get('/instructorDashboard', auth, isInstructor, instructorDashboard)

module.exports=router