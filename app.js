var express 				= require('express'),
	app 					= express(),
	bodyParser 				= require('body-parser'),
	mongoose 				= require('mongoose'),
	passport        		= require("passport"),
	LocalStrategy   		= require("passport-local"),
	methodOverride 			= require('method-override'),
	User 					= require("./models/user"),
	Blog 	 				= require("./models/blog"),
	expressSanitizer 		= require("express-sanitizer"),
	passportLocalMongoose 	= require("passport-local-mongoose")


//APP CONFIG
mongoose.connect("mongodb://localhost/restful_blog_app");
app.set("view engine", "ejs");
app.use(require("express-session")({
    secret: "facebook is shit",
    resave: false,
    saveUninitialized: false
}));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); //has to be after bodyparser
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

//--------RESTful ROUTES--------//

app.get("/", function(req, res){
	res.redirect("/blogs");
})

//INDEX ROUTE
app.get("/blogs", function(req, res){
	Blog.find({}, function(err, blogs){
		if(err){
			console.log(err);
		} else{
			res.render("index", {blogs: blogs, currentUser: req.user});
		}
	});
});

//NEW ROUTE
app.get("/blogs/new", isLoggedIn, function(req, res){
	res.render("new");
});


//CREATE ROUTE
app.post("/blogs", isLoggedIn, function(req, res){
	//create blog 
	// req.body.blog.body = req.sanitize(req.body.blog.body);
	// console.log(req.user);	
	// Blog.create(req.body.blog, function(err, newBlog){
	// 	if(err){
	// 		res.render("new");
	// 	} else {
	// 		//redirect to index
	// 		res.redirect("/blogs");
	// 	}
	// });
	var title = req.body.title;
	var image = req.body.image;
	var body  =	req.body.body;
	var author= {
		id: req.user._id,
		username: req.user.username
	}
	var newBlog = {title: title, image: image, body: body, author:author}
	Blog.create(newBlog, function(err, newlyCreated){
		if(err){
			console.log(err);
		} else {
			console.log(newlyCreated);
			res.redirect("/blogs");
		}
	});
});

//SHOW ROUTE
app.get("/blogs/:id", function(req, res){
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			res.redirect("/");
		} else {
			res.render("show", {blog: foundBlog});
		}
	});
});

//EDIT ROUTE
app.get("/blogs/:id/edit", checkBlogOwnership, function(req, res){
	Blog.findById(req.params.id, function(err, foundBlog){
		res.render("edit", {blog: foundBlog});
	});
});

//UPDATE ROUTE
app.put("/blogs/:id", checkBlogOwnership, function(req, res){
	req.body.blog.body = req.sanitize(req.body.blog.body);
	Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
		if(err){
			res.redirect("/");
		} else {
			res.redirect("/blogs/" + req.params.id);
		}
	})//id, newdata, callback
});

//DELETE ROUTE
app.delete("/blogs/:id", checkBlogOwnership, function(req, res){
	//destroy blog
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		} else{
			res.redirect("/blogs");
		}
	});
});

app.get("/register", function(req, res){
    res.render("register");
});


app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            res.render("alert");
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/blogs");
        });
    });
});


app.get("/login", function(req, res){
    res.render("login");
});
// posting !!
//middleware
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/blogs",
        failureRedirect: "/login"
    }), function(req, res){
});

// ======================
// LogOut Routes
//=======================

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/")
});

app.get("/about", function(req, res){
	res.render("about");
	res.send("about page")
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.render("loginalert");
}

function checkBlogOwnership(req, res, next){
	if(req.isAuthenticated()){
		Blog.findById(req.params.id, function(err, foundBlog){
			if(err){
				res.redirect("back");
			} else {
				if(foundBlog.author.id.equals(req.user._id)){
					next();
				} else {
					res.redirect("back");
				}
			}
		});
	} else {
		res.redirect("back");
	}
}


app.listen(4000, function(){
    console.log("Blog server has Started on Port 4000\nVisit http://localhost:4000/ to see!!!");
});
