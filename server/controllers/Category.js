const Category = require("../models/Category");

function getRandomInt(max){
    return Math.floor(Math.random() * max)
}

// create Category ka handler function Category
exports.createCategory=async(req, res)=>{
    try{
        const {name, description}=req.body;
        // validation
        if(!name){
            return res.status(400).json({
                success:false,
                message:'All fields are required'
            })
        }
        // create entry in DB
        const categoryDetails=await Category.create({
            name:name,
            description:description
        });
        console.log(categoryDetails);
        // return response
        return res.status(200).json({
            success:true,
            message:'Category created successfully'
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

// showAllCategory handler function
exports.showAllCategory=async(req, res)=>{
    try{
        const allCategory=await Category.find();
        res.status(200).json({
            success:true,
            data:allCategory
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

// categoryPageDetails
exports.categoryPageDetails=async (req, res)=>{
    try{
        // get category id
        const {categoryId}=req.body;
        // get courses for specified category
        const selectedCategory=await Category.findById(categoryId)
            .populate({
            path:'courses',
            match:{status:"Published"},
            populate:'ratingAndReviews'
            })
            .exec()

        // Handle the case when category is not found
        if(!selectedCategory){
            console.log("Category not found.")
            return res.status(404).json({
                success:false,
                message:'Category Not Found'
            })
        }

        // Handle the case when there are no courses
        if(selectedCategory.courses.length === 0 ){
            console.log("No courses found for the selected category.")
            return res.status(404).json({
                success:false,
                message:"No courses found for the selected category",
            })
        }

        // get courses for other categories
        const categoriesExceptSelected=await Category.find({
            _id:{ $ne: categoryId }
        })
        
        let differentCategory=await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        )
        .populate({
            path:'courses',
            match:{status:"Published"},
        })
        .exec()


        // get top-selling courses accross all categories
        const allCategories=await Category.find()
            .populate({
                path:"courses",
                match:{status:"Published"},
                populate:{
                    path:"instructor"
                },
            })
            .exec()
    
        const allCourses=allCategories.flatMap((category)=>category.courses)
        
        const mostSellingCourses=allCourses.sort((a,b)=>b.sold - a.sold).slice(0, 10);
        
        // return response
        return res.status(200).json({
            success:true,
            data:{
                selectedCategory,
                differentCategory,
                mostSellingCourses
            }
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Internal server error',
            error:error.message
        })
    }
}