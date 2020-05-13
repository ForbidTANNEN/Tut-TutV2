const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
app.use(bodyParser.urlencoded({
  extended: true
}));
const https = require("https");
app.set('view engine', 'ejs');
var _ = require('lodash');

app.use(express.static("public"));
app.use(session({
  secret: "Our Little Secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-tannen:vBjDh5hryoB5gArK@cluster0-k0mtj.mongodb.net/test?retryWrites=true&w=majority", {
  useNewUrlParser: true,
   useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);

// ACCount

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  age: Number
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", function(req, res) {
  if(req.isAuthenticated()){
    res.redirect("/secrets");
  }else{
      res.render("login", {loginFailure: ""});
  }
});

app.get("/signup", function(req, res) {
  res.render("signup", {signupFailure: ""});
});

app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.sendFile(__dirname + "/loggedIn.html")
    console.log(req.user);
  }else{
    res.redirect("/login");
  }
});

app.post("/signup", function(req, res){

  if(isNaN(req.body.age)){
    res.render("signup", {signupFailure: "Please have age as a number"})
  }else{
  User.findOne({username: req.body.username}, function(err, foundUsers){
      if(foundUsers === null){
        User.register({username: req.body.username, age: req.body.age}, req.body.password, function(err, user){
          if(err){
            console.log(err);
            res.redirect("/signup");
          }else{
            passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets");
            });
          }
        })
    }else{
      res.render("signup", {signupFailure: "That email is already asigned to an email"});
    }
})}
});

app.post("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post('/login', (req, res, next) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  passport.authenticate('local',
  (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      res.render("login", {loginFailure: info.message});
    }

    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }

      return res.redirect('/secrets');
    });

  })(req, res, next);
});

    app.listen(process.env.PORT || 3000, function() {
      console.log("Server running");
    });
