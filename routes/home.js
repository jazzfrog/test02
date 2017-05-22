var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var Data = require('../models/Data');

router.get("/",function(req, res) {
  Data.findOne({name:"myData"}, function(err,data){
    if(err) return console.log("Data error: ",err);
    data.count++;
    data.save(function(err){
      if(err) return console.log("data save err: ", err);
      res.render('my_ejs',data);
    });
  });
});


router.get("/login", function(req,res) {
  res.render("login/login", {email:req.flash("email")[0], loginError:req.flash("loginError")});
});

router.post("/login", function(req,res,next){
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

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


router.get("/reset",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');
  // data.count=0;
  setCnt(res,0);
  // res.render('my_ejs',data);
});

router.get("/set/count",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');
  // if (req.query.count) data.count=req.query.count;
  if (req.query.count) setCnt(res,req.query.count);
  else getCnt(res);
  // res.render('my_ejs',data);
});

router.get("/set/:num",function(req, res) {
  // res.send('Hello World..!<p> HaHa ..!');
  // if (req.params.num) data.count=req.params.num;
  if (req.params.num) setCnt(res,req.params.num);
  else getCnt(res);
  // res.render('my_ejs',data);
});

module.exports = router;
