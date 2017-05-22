var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/User');
var async = require('async');

router.get("/new", function(req, res){
  res.render('users/new', {
    formData : req.flash('formData')[0],
    emailError: req.flash('emailError')[0],
    nicknameError: req.flash('nicknameError')[0],
    passwordError: req.flash('passwordError')[0]
  }
);
});

router.post('/', checkUserRegValidation, function(req, res, next){
  User.create(req.body.user, function(err, user) {
    if(err) return res.json({success:false, message:err});
    res.redirect("/login");
  });
});

router.get("/:id",  isLoggedIn, function(req, res){
  User.findById(req.params.id, function(err, user){
    if(err) return res.json({success:false, message:err});
    res.render("users/show", {user: user});
  });
});

router.get("/:id/edit",  isLoggedIn, function(req, res){
  console.log("_____user.email="+ req.user.email);
  if(req.user._id != req.params.id && req.user.email !="ha") return res.json({success:false,message:"Unauthorized Attempt"});
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

router.put("/users/:id", isLoggedIn, checkUserRegValidation, function(req, res){
  if(req.user._id != req.params.id && req.user.email !="ha") return res.json({success:false,message:"Unauthorized Attempt..!"});
  User.findById(req.params.id, req.body.user, function(err,user){
    if(err) return res.json({success:"false", message: err});
    // if(req.body.user.password == user.password) {
    if(user.authenticate(req.body.user.password)) {
      if(req.body.user.newPassword) {
        // req.body.user.password = req.body.user.newPassword;
        // user.password = req.body.user.newPassword;   // 에러발생...
        req.body.user.password = user.hash(req.body.user.newPassword);
        // user.save();                                 // 에러발생...
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

router.delete("/:id",function(req, res) {
  // req.body.post.updatedAt=Date.now();
  User.findByIdAndRemove(req.params.id,  function(err,user){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, message:post._id+" deleted"});
    res.redirect("/posts");
  });
});

router.get("/:id/list",function(req, res) {
  User.find({}).sort('email').exec( function(err,users){
    if(err) return res.json({success:false, message:err});
    res.render("users/list",{data:users});
  });
});


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
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

module.exports = router;
