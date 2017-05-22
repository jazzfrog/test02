var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = require('../models/Post');
var Data = require('../models/Data');

router.get("/",function(req, res) {
  // Post.find({}, function(err,posts){
  Post.find({}).populate('author').sort('-createdAt').exec( function(err,posts){
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

router.get("/new",  isLoggedIn, function(req, res) {
  res.render("posts/new", {user:req.user});
});

router.post("/",  isLoggedIn, function(req, res) {
  req.body.post.author = req.user._id;
  Post.create(req.body.post, function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, data:post});
    res.redirect("/posts");
  });
});

router.get("/:id",function(req, res) {
  Post.findById(req.params.id).populate('author').exec(function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, data:post});
    res.render("posts/show",{post:post, user:req.user});
  });
});

router.get("/:id/edit", isLoggedIn, function(req, res) {
  Post.findById(req.params.id, function(err,post){
    if(err) return res.json({success:false, message:err});
    if(!req.user._id.equals(post.author)) return res.json({success:false, message:"Unauthorized attempt"});
    // res.json({success:true, data:post});
    res.render("posts/edit",{data:post, user:req.user});
  });
});

router.put("/:id", isLoggedIn, function(req, res) {
  req.body.post.updatedAt=Date.now();
  // old version
  /*
  Post.findById(req.params.id, function(err, post){
    if(err) return res.json({success:false, message:err});
    if(!req.user._id.equals(post.author)) return res.json({success:false, message:"Unauthorized attempt"});
    Post.findByIdAndUpdate(req.params.id, req.body.post, function(err,post){
      if(err) return res.json({success:false, message:err});
      // res.json({success:true, message:post._id+" updated"});
      res.redirect("/posts/"+req.params.id);
    });
  });
  */

  // new version
  Post.findOneAndUpdate({_id:req.params.id, author:req.user._id}, req.body.post, function(err, post){
    if(err) return res.json({success:false, message:err});
    if(!post) return res.json({success:false, message:"No data found to update"});
    res.redirect("/posts/"+req.params.id);
    });
});

router.delete("/:id", isLoggedIn, function(req, res) {
  // req.body.post.updatedAt=Date.now();

  // old version
  /*
  Post.findById(req.params.id,  function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, message:post._id+" deleted"});
    if(!req.user._id.equals(post.author)) return res.json({success:false, message:"Unauthorized attempt"});
    Post.findByIdAndRemove(req.params.id, function (err,post){
      if(err) return res.json({success:false, message: err});
      res.redirect("/posts");
    })
  });
  */

  // new version
  Post.findOneAndRemove({_id:req.params.id, author:req.user._id}, function(err,post){
    if(err) return res.json({success:false, message:err});
    // res.json({success:true, message:post._id+" deleted"});
    if(!post) return res.json({success:false, message:"No data found to delete..!"});
    res.redirect("/posts");
  });

});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}

module.exports = router;
