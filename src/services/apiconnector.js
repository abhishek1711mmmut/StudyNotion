import axios from "axios";


// creating generic request
export const axiosInstance=axios.create({});


// handle 401 error using interceptors if user token is expired, then redirect it to loginpage
axiosInstance.interceptors.response.use((response)=>response,
  (error)=>{
    if(error.response.status===401 && error.response.data.message==="token is invalid"){
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location='/login';
    }
    return Promise.reject(error);
  }
)

export const apiConnector=(method, url, bodyData, headers, params)=>{
    return axiosInstance({
        method:`${method}`,
        url:`${url}`,
        data: bodyData ? bodyData :null,
        headers: headers ? headers : null,
        params: params ? params : null
    });
}