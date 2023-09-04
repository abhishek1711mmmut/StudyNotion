const express=require('express');
const app=express();

const userRoute=require('./routes/User');
const profileRoute=require('./routes/Profile');
const paymentRoute=require('./routes/Payment');
const courseRoute=require('./routes/Course');
const contactUsRoute=require('./routes/Contact');

const database=require('./config/database');
const cookieParser=require('cookie-parser');
const cors=require('cors');
const {cloudinaryConnect}=require('./config/cloudinary');
const fileUpload=require('express-fileupload');
const dotenv=require('dotenv');
dotenv.config();

const PORT=process.env.PORT || 4000;

// database connect
database.connect();

// middleware
app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        // origin:'http://localhost:3000',
        origin:"*",
        credentials:true
    })
)
app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:'/tmp/'
    })
)

// cloudinary connect
cloudinaryConnect();

// routes mount
app.use('/api/v1/auth', userRoute);
app.use('/api/v1/profile', profileRoute);
app.use('/api/v1/course', courseRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/reach', contactUsRoute);

// testing server route
app.get('/', (req, res)=>{
    return res.json({
        success:true,
        message:'Your server is up and running...'
    })
})

// activate
app.listen(PORT, ()=>{
    console.log(`App is listening at ${PORT}`);
})