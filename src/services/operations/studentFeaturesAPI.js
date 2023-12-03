// script load krna hai
// modal open krne ke liye option object create krna hai

import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
// import rzpLogo from '../../assets/Logo/rzp_logo.png'
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";

const {COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API}=studentEndpoints;

function loadScripts(src){
    return new Promise((resolve)=>{
        const script=document.createElement("script");
        script.src=src;

        script.onload=()=>{
            resolve(true);
        }
        script.onerror=()=>{
            resolve(false);
        }
        document.body.appendChild(script);
    })
}

export async function buyCourse(token, courses, userDetails, navigate, dispatch){
    const toastId=toast.loading("Loading...");
    try {
        // load the script
        const res=await loadScripts("https://checkout.razorpay.com/v1/checkout.js");

        if(!res){
            toast.error("RazorPay SDK failed to load. Check your Internet Connection");
            return;
        }

        // initiate the order
        const orderResponse=await apiConnector("POST", COURSE_PAYMENT_API, {courses},{Authorization: `Bearer ${token}`})
        console.log('ORDER RESPONSE...', orderResponse);
        if(!orderResponse.data.success){
            throw new Error(orderResponse.data.message)
        }

        // options
        const options={
            key:"rzp_test_wU0ZKD6JwuYpvn",
            currency:orderResponse.data.data.currency,
            amount:`${orderResponse.data.data.amount}`,
            order_id:orderResponse.data.data.id,
            name:"StudyNotion",
            description:'Thank You for Purchasing the Course',
            // image:rzpLogo,
            prefill:{
                name:`${userDetails.firstName}`,
                email:userDetails.email
            },
            handler: function(response){
                // send successfull email
                sendPaymentSuccessEmail(response, orderResponse.data.data.amount, token);
                // verifyPayment
                verifyPayment({...response, courses}, token, navigate, dispatch);
            }
        }

        const paymentObject=new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response){
            toast.error("oops, payment failed");
            console.log(response.error);
        })

    } catch (error) {
        console.log('PAYMENT API ERROR.......', error);
        toast.error('Could not make Payment');
    }
    toast.dismiss(toastId);
}

// verify payment
async function verifyPayment(bodyData, token, navigate, dispatch){
    const toastId=toast.loading("Loading...");
    dispatch(setPaymentLoading(true));
    try {
        const response=await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`
        })

        console.log("VERIFY PAYMENT RESPONSE FROM BACKEND..........", response)

        if(!response.data.success){
            throw new Error(response.data.message);
        }
        toast.success("Payment Successfull, you are added to the course");
        navigate('/dashboard/enrolled-courses');
        dispatch(resetCart());
    } catch (error) {
        console.log('VERIFY PAYMENT API ERROR......', error);
        toast.error("Could not verify payment");
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}

async function sendPaymentSuccessEmail(response, amount, token){
    try {
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId:response.razorpay_order_id,
            paymentId:response.razorpay_payment_id,
            amount,
        },{
            Authorization:`Bearer ${token}`
        })
    } catch (error) {
        console.log("PAYMENT SUCCESS EMAIL API ERROR.......", error);
    }
}
