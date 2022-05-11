//jshint esversion:6
//Dependencies for the project
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose=require("mongoose");
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")



//Global Variables
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
var currentLoggedInUser=" ";


//setting up app and express
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//passport session and strategy settings
app.use(session({
  secret:'DirtyLittleSecrets',
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Amar-owner:b95NKPYtz6h10L30@cluster0.ob9je.mongodb.net/blogDB");


//Mongoose schema settings
const blogSchema =new mongoose.Schema({
  title: String,
  content: String,
  publisher: String,
  userId: String
});
const blogUserSchema = new mongoose.Schema({
  name: String,
  username: String,
  mail: String,
  password: String,
});

blogUserSchema.plugin(passportLocalMongoose);


//Mongoose Model stups
const blog=new mongoose.model("blog",blogSchema);
const blogUser=new mongoose.model("blogUSer",blogUserSchema);


//Passport local strategy setting with user database
passport.use(blogUser.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  blogUser.findById(id, function(err, user) {
    done(err, user);
  });
});


//Global variable
var LoggedInUserObject


//All get requests
app.get("/", function(req, res){
  if(req.isAuthenticated()){
    blog.find(function(err,allBlogs){
      if(!err){
        res.render("home", {
             startingContent: homeStartingContent,
             posts: allBlogs,
             userStatus: true,
             userName: LoggedInUserObject.name        
             });
      }
    })
  }else{
    blog.find(function(err,allBlogs){
      if(!err){
        res.render("home", {
             startingContent: homeStartingContent,
             posts: allBlogs,
             userStatus: false  
             });
      }
    })
  }
});

app.get("/about", function(req, res){
  if(req.isAuthenticated()){
    res.render("about", {aboutContent: aboutContent,userStatus:true});
  }else{
    res.render("about", {aboutContent: aboutContent,userStatus:false});
  }
});

app.get("/contact", function(req, res){
  if(req.isAuthenticated()){
    res.render("contact", {contactContent: contactContent,userStatus:true});
  }else{
    res.render("contact", {contactContent: contactContent,userStatus:false});
  }
});

app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
    res.render("compose",{userStatus:true});
    
  }else{
    res.redirect("login");
  }
});

app.get("/register",function(req,res){
  res.render("register",{userStatus:false})
});

app.get("/login",function(req,res){
  res.render("login",{userStatus:false})
});

app.get("/myPosts",function(req,res){
  if(req.isAuthenticated()){
    blog.find({userId:LoggedInUserObject._id},function(err,foundBlogs){
      if(err){
        console.log(err);
      }else{
        res.render("myPosts",{userStatus:true,posts:foundBlogs});
      }
    })
  }else{
    res.redirect("login");
  }
})

app.get("/posts/:postId", function(req, res){
  const requestedId = req.params.postId;

  blog.findOne({_id:requestedId},function(err,foundBlog){
    // const storedTitle = _.lowerCase(foundBlog.title);

    if(req.isAuthenticated()){
      if(!err){
        res.render("post", {
          title: foundBlog.title,
          content: foundBlog.content,
          publisher: foundBlog.publisher,
          userStatus:true
        });
      }
    }else{
      if(!err){
        res.render("post", {
          title: foundBlog.title,
          content: foundBlog.content,
          publisher: foundBlog.publisher,
          userStatus:false
        });
      }
    }
  });

});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
})


//All post requests
app.post("/search", function(req,res){
  const s = req.body.search;
  blog.find({title:s}, function(err,foundBlogs){
    if(!err){
      res.render("searched",{ 
        posts:foundBlogs,
        userStatus:false
      })
    }
  })

})

app.post("/compose", function(req, res){
  const post = {
    title: req.body.postTitle,
    content: req.body.postBody,
    publisher:LoggedInUserObject.name,
    user:LoggedInUserObject._id
  };

  
  const newblog = new blog({
    title:post.title,
    content:post.content,
    publisher:post.publisher,
    userId:post.user
  })

  newblog.save(function(err){
    if(!err){
      res.redirect("/"); 
    }
  });
  
});

app.post("/register", function(req,res){
  blogUser.register({username:req.body.username,name:req.body.name, mail:req.body.mail},req.body.password, function(err,blogUSer){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        currentLoggedInUser = req.body.username;
          blogUser.findOne({username:currentLoggedInUser},function(err,foundUser){
            if(err){
              console.log(err);
            }else{
              LoggedInUserObject=foundUser.toObject();
            }
          });
        res.redirect("/");
      })
    }
  })
})

app.post("/login",function(req,res){
  const newUser = new blogUser({
    username:req.body.username,
    password:req.body.password 
  });

  req.login(newUser,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
          currentLoggedInUser = req.body.username;
          blogUser.findOne({username:currentLoggedInUser},function(err,foundUser){
            if(err){
              console.log(err);
            }else{
              LoggedInUserObject=foundUser.toObject();
            }
          });
          res.redirect("/");
      })
    }
  })
})




app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});


