const express =require("express");
const app= express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const Review=require("./models/review.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema}=require("./utils/schema.js");


main().then(()=>{
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/Wanderlust');
};


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/",(req,res)=>{
    res.send("Hi,I am root");
});

const validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,error);
    }else{
        next();
    }
};

//Index route
app.get("/listings",wrapAsync(async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}));

//new route
app.get("/listings/new",(req,res)=>{
    res.render("listings/form.ejs");
});

//show route
app.get("/listings/:id",wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
}));

//create route
app.post("/listings",validateListing,wrapAsync(async(req,res)=>{
    
     const newListing=new Listing(req.body.listing);
     await newListing.save();
     const allListings=await Listing.find({});
     res.render("listings/index.ejs",{allListings});
}));


//edit route
app.get("/listings/:id/edit", wrapAsync(async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});

}));

//update route
app.put("/listings/:id",validateListing,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id ,{...req.body.listing});
    res.redirect("/listings");
}));

//Delete route
app.delete("/listings/:id", wrapAsync(async(req,res)=>{
    let{id}=req.params;
    let deleteListing=await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));


//Reviews---POST Route
app.post("/listings/:id/reviews" ,async(req,res)=>{
    let listing=await Listing.findById(req.params.id);
    console.log(Review);
    let newReview= new Review(req.body.review);


    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);

});


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});

app.use((err,req,res,next)=>{
    let{status=500,message="Something went wrong!"}=err;
    res.status(status).render("error.ejs",{message});
    // res.status(status).send(message);
})

app.listen(8080,()=>{
    console.log("8080");
});