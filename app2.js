var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');

var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');

var bodyParser = require('body-parser');
var methodOverride = require('method-override');


mongoose.connect(process.env.MONGO_DB);

var db = mongoose.connection;
db.once("open", function(){
  console.log("DB connected");
});
db.on("error", function(err) {
  console.log("DB Error :", err);
});


// ===
var dataSchema = mongoose.Schema({
  name:String,
  count:Number
});

var postSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});

var userSchema = mongoose.Schema({
  email: {type:String, required:true, unique:true},
  nickname: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  createdAt: {type:Date, default:Date.now}
});

var Data = mongoose.model('data',dataSchema);
var Post = mongoose.model('post',postSchema);
var User = mongoose.model('user',userSchema);


Data.findOne( {name:"myData"}, function(err, data){
  if(err) return console.log("Data Error:",err);
  if(!data){
    Data.create( {name:"myData",count:0}, function(err,data){
      if(err) return console.log("Data Err : ", err);
      console.log("counter init : ",data);
    });
  }
});

// ===


// var MongoClient = require('mongodb').MongoClient;

//var uri = "mongodb://";
//MongoClient.connect(uri, function(err, db) {
//  db.close();
//});


app.set("view engine",'ejs');

app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

app.use(flash());
app.use(session({secret:'MySecret'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

var LocalStrategy = require('passport-local').Strategy;
passport.use('local-login',
   new LocalStrategy({
       usernameField : 'email',
       passwordField : 'password',
       passReqToCallback : true
   },
   function(req, email, password, done) {
     User.findOne({'email': email}, function(err, user){
       if (err) return done(err);

       if (!user) {
         req.flash('email', req.body.email);
         return done(null, false, req.flash('loginError','No user found.'));
       }

       if (user.password != password){
         req.flash('email', req.body.email);
         return done(null, false, req.flash('loginError', 'Password does not Match.'));
       }

       return done(null, user);
     });
   }
 )
);

// var data={count:0};


app.get("/",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');

  // data.count++;


  Data.findOne({name:"myData"}, function(err,data){
    if(err) return console.log("Data error: ",err);
    data.count++;
    data.save(function(err){
      if(err) return console.log("data save err: ", err);
      res.render('my_ejs',data);
    });
  });

  // res.render('my_ejs',data);
});


app.get("/login", function(req,res) {
  res.render("login/login", {email:req.flash("email")[0], loginError:req.flash("loginError")});
});

app.post("/login", function(req,res,next){
  req.flash("email");
  if(req.body.email.length === 0 || req.body.password.length ===0){
    req.flash("email", req.body.email);
    req.flash("loginError","Please enter both email and password.");
    res.redirect("/login");
  } else {
    next();
  }
}, passport.authenticate('local-login', {
  successRedirect : "/posts",
  failureRedirect : "/login",
  failureFlash : true
})
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get("/reset",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');
  // data.count=0;
  setCnt(res,0);
  // res.render('my_ejs',data);
});

app.get("/set/count",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');
  // if (req.query.count) data.count=req.query.count;
  if (req.query.count) setCnt(res,req.query.count);
  else getCnt(res);
  // res.render('my_ejs',data);
});

app.get("/set/:num",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');
  // if (req.params.num) data.count=req.params.num;
  if (req.params.num) setCnt(res,req.params.num);
  else getCnt(res);
  // res.render('my_ejs',data);
});


app.get("/posts",function(req, res) {
  // Post.find({}, function(err,posts){
  Post.find({}).sort('-createdAt').exec( function(err,posts){
    if(err) return res.json({success:false, message:err});
    //res.json({success:true, data:posts});

    Data.findOne({name:"myData"}, function(err,data){
      if(err) return console.log("Data error: ",err);
      data.count++;
      data.save(function(err){
        if(err) return console.log("data save err: ", err);
        //res.render('footer',data);
        res.render("posts/index",{data:posts, cntt:data, user:req.user});
      });
    });

    // res.render("posts/index",{data:posts, cntt:55});
  });

});

app.get("/posts/new",function(req, res) {
  res.render("posts/new");
});

app.post("/posts",function(req, res) {
  Post.create(req.body.post, function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, data:post});
    res.redirect("/posts");
  });
});

app.get("/posts/:id",function(req, res) {
  Post.findById(req.params.id, function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, data:post});
    res.render("posts/show",{data:post});
  });
});

app.get("/posts/:id/edit",function(req, res) {
  Post.findById(req.params.id, function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, data:post});
    res.render("posts/edit",{data:post});
  });
});

app.put("/posts/:id",function(req, res) {
  req.body.post.updatedAt=Date.now();
  Post.findByIdAndUpdate(req.params.id, req.body.post, function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, message:post._id+" updated"});
    res.redirect("/posts/"+req.params.id);
  });
});

app.delete("/posts/:id",function(req, res) {
  // req.body.post.updatedAt=Date.now();
  Post.findByIdAndRemove(req.params.id,  function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, message:post._id+" deleted"});
    res.redirect("/posts");
  });
});


app.get("/users/new", function(req, res){
  res.render('users/new', {
    formData : req.flash('formData')[0],
    emailError: req.flash('emailError')[0],
    nicknameError: req.flash('nicknameError')[0],
    passwordError: req.flash('passwordError')[0]
  }
);
});

app.post('/users', checkUserRegValidation, function(req, res, next){
  User.create(req.body.user, function(err, user) {
    if(err) return res.json({success:false, message:err});
    res.redirect("/login");
  });
});

app.get("/users/:id", function(req, res){
  User.findById(req.params.id, function(err, user){
    if(err) return res.json({success:false, message:err});
    res.render("users/show", {user: user});
  });
});

app.get("/users/:id/edit", function(req, res){
  User.findById(req.params.id, function(err, user){
    if(err) return res.json({success:false, message:err});
    res.render("users/edit", {
      user: user,
      formData: req.flash('formData')[0],
      emailError: req.flash('emailError')[0],
      nicknameError: req.flash('nicknameError')[0],
      passwordError: req.flash('passwordError')[0]
    });
  });
});

app.put("/users/:id", checkUserRegValidation, function(req, res){
  User.findById(req.params.id, req.body.user, function(err,user){
    if(err) return res.json({success:"false", message: err});
    if(req.body.user.password == user.password) {
      if(req.body.user.newPassword) {
        req.body.user.password = req.body.user.newPassword;
      } else {
        delete req.body.user.password;
      }
      User.findByIdAndUpdate(req.params.id, req.body.user, function(err,user) {
        if(err) return res.json({success: "false", message: err});
        res.redirect("/users/"+req.params.id);
      });
    } else {
      req.flash("formData", req.body.user);
      req.flash('passwordError',"- Invalid password");
      req.redirect("/users/"+req.params.id+"/edit");
    }
  });
});


console.log(__dirname);


function getCnt(res) {
  console.log("get CNT");

  Data.findOne( {name:"myData"}, function(err, data){
  if(err) return console.log("Data get Error:",err);
  if(!data){
    Data.create( {name:"myData",count:0}, function(err,data){
      if(err) return console.log("Data making Err : ", err);
      console.log("counter init : ",data);
      // res.render('my_ejs',data);
    });
  }
  res.render('my_ejs',data);
});
}

function setCnt(res, num){
  console.log("set CNT");
  Data.findOne({name:"myData"}, function(err,data){
    if(err) return console.log("Data set error: ",err);
    data.count = num;
    data.save(function(err){
      if(err) return console.log("data save err: ", err);
      res.render('my_ejs',data);
    });
  });
}

function checkUserRegValidation(req, res, next) {
  var isValid = true;

  async.waterfall(
    [function(callback) {
      User.findOne({email: req.body.user.email, _id: {$ne: mongoose.Types.ObjectId(req.params.id)}},
        function(err,user){
            if(user){
              isValid = false;
              req.flash('emailError', "- This email is already resistered.");
            }
            callback(null, isValid);
        }
    );
  }, function(isValid, callback) {
    User.findOne({nickname: req.body.user.nickname, _id: {$ne: mongoose.Types.ObjectId(req.params.id)}},
      function(err, user){
        if(user) {
          isValid = false;
          req.flash("nickNameError","- This nickname is already resistered.");
        }
        callback(null, isValid);
      }
    );
  }], function(err, isValid) {
    if(err) return res.json({success:"false", message: err});
    if(isValid) {
      return next();
    } else {
      req.flash("formData", req.body.user);
      res.redirect("back");
    }
  }
  );
}


app.listen(3002, function() {
  console.log('===HAHA===> Server is ejs On....!');
});
