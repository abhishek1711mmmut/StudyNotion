const User=require('../models/User');
const mailSender=require('../utils/mailSender');
const bcrypt=require('bcrypt');
const crypto=require('crypto');

// resetPasswordToken
exports.resetPasswordToken=async(req, res)=>{
    try{
        // get email from req body
        const email=req.body.email;
        // check user for this email, email validation
        const user=await User.findOne({email});
        if(!user){
            return res.json({
                success:false,
                message: `This Email: ${email} is not Registered With Us, Enter a Valid Email `
            })
        }
        // generate token, 2 method are given below, both will work
        // const token=crypto.randomUUID();
        const token = crypto.randomBytes(20).toString("hex");
        // update user by adding token and expiration time
        const updatedDetails=await User.findOneAndUpdate(
            {email: email},
            {
                token:token,
                resetPasswordExpires: Date.now() + 300000,
            },
            {new:true});

        console.log("DETAILS", updatedDetails);
        // create url
        // const url=`http://localhost:3000/update-password/${token}`;
        const url = `https://Studynotion-Frontend.vercel.app/update-password/${token}`
        // send mail contaning the url
        await mailSender(
            email, 
            'Password Reset Link',
            `Your Link for email verification is ${url}. Please click on this link to reset your password.`
        );
        // return response
        return res.json({
            success:true,
            message:'Email Sent Successfully, Please Check Your Email to Continue Further'
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Something went wrong while sending reset password email'
        })
    }
}

// resetPassword
exports.resetPassword=async(req, res)=>{
    try{
        // data fetch
        const {password, confirmPassword, token}=req.body;
        // validation
        if(password!==confirmPassword){
            return res.json({
                success:false,
                message:'Password and Confirm Password does not Match'
            });
        }
        // get userdetails from db
        const userDetails=await User.findOne({token});
        // if no entry - invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:'Token is Invalid'
            });
        }
        // token time check
        if(userDetails.resetPasswordExpires<Date.now()){
            return res.status(403).json({
                success:false,
                message:'Password reset link is expired, Please regenerate password reset link'
            })
        }
        // hash pwd
        const hashedPassword=await bcrypt.hash(password, 10);
        // password update
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true}
        );
        // return response
        return res.json({
            success:true,
            message:'Password reset successfull'
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Something went wrong while sending password reset mail'
        })
    }
}