var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
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

var Data = mongoose.model('data',dataSchema);
var Post = mongoose.model('post',postSchema);

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
        res.render("posts/index",{data:posts, cntt:data});
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

app.listen(3002, function() {
  console.log('===HAHA===> Server is ejs On....!');
});
