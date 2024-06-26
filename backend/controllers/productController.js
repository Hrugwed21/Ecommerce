const catchAsyncError = require("../middleware/catchAsyncError");
const Product  = require("../models/productModels");
const ApiFeatures = require("../utils/apifeatures");
const ErrorHander = require("../utils/errorhander");

//CREATE PRODUCT -- admin

exports.createProduct = catchAsyncError(async(req,res,next)=>{
    
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
        success : true,
        product
    })          
});



//Get All Products
exports.getAllProducts = catchAsyncError(async (req, res) => {
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();
  
    const apiFeature = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter();
  
    let productsQuery = apiFeature.query; // Execute the query once and store it in a variable
  
    // Apply pagination to the stored query result
    apiFeature.pagination(resultPerPage);
    productsQuery = await apiFeature.query;
  
    let filteredProductsCount = productsQuery.length;
  
    res.status(200).json({
      success: true,
      products: productsQuery, // Use the stored query result here
      productsCount,
      resultPerPage,
      filteredProductsCount,
    });
});
  

//Get Product Details

exports.getProductDetails = catchAsyncError(async(req,res,next)=>{
    const product = await Product.findById(req.params.id);
    
    if(!product){
        return next(new ErrorHander("Product not found",404));
    }
    
    
    res.status(200).json({
        success:true,
        product,
    })
});

//update Product -- Admin     

exports.updateProduct = catchAsyncError(async(req,res,next)=>{
    let product = await Product.findById(req.params.id);
    
    if(!product){
        return next(new ErrorHander("Product not found",404));
    }
    

    product = await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });

    res.status(200).json({
        success:true,
        product
    })
});

// Delete Product -- Admin

exports.deleteProduct = catchAsyncError( async(req,res,next)=>{

    const product = await Product.findById(req.params.id);
    
    if(!product){
        return next(new ErrorHander("Product not found",404));
    }
    
    
    await product.deleteOne();

    res.status(200).json({
        success:true,
        message:"Product Deleted Successfully" 
    })
});

// Create New Reviews or Update the review 

exports.createProductReview = catchAsyncError(async (req,res,next) => {
    const { rating, comment, productId} = req.body;

    const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach((rev) =>{
        if(rev.user.toString === req.user._id.toString())
          (rev.rating = rating), (rev.comment = comment);
      });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }
    
    let avg =0;

    product.reviews.forEach((rev) => {
        avg += rev.rating;
     })

    product.ratings = avg
     / product.reviews.length;

   
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success : true,
    });
});

// Get all reviews of a product

exports.getProductReviews = catchAsyncError(async (req,res,next) => {
   const product = await Product.findById(req.query.id);

   if(!product) {
    return next(new ErrorHander("Product not found", 404));
   }

   res.status(200).json({
    success: true,
    reviews: product.reviews,
   });
});

exports.deleteReviews = catchAsyncError(async (req,res,next) => {
    const product = await Product.findById(req.query.productId);
    
   if(!product) {
    return next(new ErrorHander("Product not found", 404));
   }

   const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
   );
   
    let avg =0;

    reviews.forEach((rev) => {
        avg += rev.rating;
     })

    const ratings = avg / reviews.length;
    
    const numOfReviews = reviews.length;
    
    await Product.findByIdAndUpdate(
    req.query.productId,
    {
        reviews,
        ratings,
        numOfReviews,
    },
    {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    }
    );

   res.status(200).json({
    success: true,
   });
})