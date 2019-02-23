var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scarping tools
//Axios is a promised based http library, similar to jQuiery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({extended: true}));
app.use(express.json());
//make public a static folder
app.use(express.static("publc"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Scraper", {
  useNewUrlParser: true
});

//Routes
//A get route for scaping 
app.get("/scrape", function(req, res) {
  //First we grab the body of the html with axios
  axios.get("https.//kingarthurflour.com/recipes/").then(function (response) {
    //the we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    const recipeArr = [];
    // now we grab every li recipe-toprated-li tag, and do the folowing:
    $("recipe-toprated-li li").each(function (i, element) {
      //Save an empty result obleject
      var result = {};

      // add the label, text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .find("figure")
        .children("h2")
        .text();
       result.link = $(this)
       .children("a")
       .attr("href");

       recipeArr.push(result);

    });

    db.Recipe.create(recipeArr)
    .then(() => res.send("Scrape Complete"))
    .catch(err => {
      console.log(err);
      res.json(err);
    })

  });
});

// route for getting all Recipes from the db
app.get("/recipes", function (req, res) {
  // grab every document in the Recipes collection
  db.Recipe.find({})
  .then(function (dbRecipe) {
    // if we were able to successully find Recipes send them back to the client
    res.json(dbRecipe);
  })
  .catch(function (err) {
    //if an error occured, send it to the client
    res.json(err);
  });
});

// route for grabbing a specific Recipe be id, populate it with it's note
app.get("/recipes/:id", function(req, res) {
  //using the id passed in the id prameter, prepare a query that find the matching on in the db
  db.Recipe.findOne({_id: req.params.id})
  // and populate all the notes associated with it
  .populate("note")
  .then(function (dbRecipe) {
    //if were able to successfully find a Recipe with the given id, send it back to the client
    res.json(dbRecipe);
  })
  .catch(function (err) {
    //if an error occured, send it to the client
    res.json(err);
  });
});

// route for saving/updaing a Recipe's associeate Note
app.post("/recipes/:id", function (req, res) {
  //create anew note and pass the req.body the entry
  db.Note.create(req.body)
  .then(function (dbNote) {
    return db.Recipe.findOneAndUpdate({ _id: req.params.id}, {note: dbNote._id}, {new: true});
  })
  .then(function(dbRecipe) {
    //if we were able to update a Recipe send it back to the client
    res.json(dbRecipe);
  })
  .catch(function (err) {
    // if an error occurs, send it to the client
    res.json(err);
  });
});

// start the server
app.listen(PORT, function () {
  console.log("App server running on port " + PORT + "!");
});