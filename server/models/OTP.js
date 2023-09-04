const mongoose=require('mongoose');
const mailSender = require('../utils/mailSender');
const emailTemplate=require('../mail/templates/emailVerificationTemplate');

const OTPSchema=new mongoose.Schema({
   email:{
    type:String,
    required:true
   },
   otp:{
    type:String,
    required:true
   },
   createdAT:{
    type:Date,
    default:Date.now,
    expires: 5 * 60  // The document will be automatically deleted after 5 minutes of its creation time
   }
});

// a function -> to send emails
// Create a transporter to send emails
// Define the email options
// Send the email
async function sendVerificationEmail(email, otp){
    try{
        const mailResponse=await mailSender(
            email, 
            'Verification email', 
            emailTemplate(otp));
        console.log('Email sent successfully', mailResponse);
    }catch(error){
        console.log('error occured while sending mail',error);
        throw error;
    }
}

// sending otp before saving doc
OTPSchema.pre('save', async function(next){
    if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    next();
})

module.exports=mongoose.model('OTP', OTPSchema);