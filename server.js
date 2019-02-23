var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

//our scraping tools: axios and cheerio
var axios = require("axios");
var cheerio = require("cheerio");

//require all models
var db = require("./models");

var PORT = 3000;

//initialize express
var app = express();

//use morgan logger for logging requests
app.use(logger("dev"));
//parse request body as JSON
app.use(express.urlencoded({extended: true}));
app.use(express.json());
//make public a static folder
app.use (express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18KingArthurFlour", {useNewUrlParser: true});


// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  //first, we grab the body of the html with axios
  axios.get("https://www.kingarthurflour.com/recipes/").then(function(response) {
    //Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(respons.data);
    const recipeArr = [];
    //Now, we grab everh h2 within a recipe tag, and do the following:
    $("recipe-curated-li").each(function(i, element) {
      //save an empty result object
      var result = {};

      //Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
      .children("a")
      .find("h5")
      .text()
      result.link = $(this)
      .children("a")
      .attr("href")

      recipeArr.push(result)
    });

    db.Recipe.create(recipeArr)
    .then(() => res.send("Scrape Complete"))
    .catch(err => {
      console.log(err);
      res.json(err);
    })
  });
});

//route for getting all recipes from the db
app.get("/recipes", function(req, res) {
  //grab every document in the recipes collection
  db.Recipe.find({})
  .then(function(dbRecipe) {
    //if we were able to SUCCESSFULLY find recipes, send them back to the client
    res.json(dbRecipe);
  })
  .catch(function(err) {
    //if an error occurs :( send it to the client
    res.json(err);
  });
});

//route for grabbing a specific recipe by id, populate it with it's note
app.get("/recipes/:id", function(req, res) {
//use the id passin the id parameter, prepare a query that finds the matching one in db
db.Recipe.findOne({_id: requ.prams.id})
// and populate all of the notes associated with it
.populate("note")
.then(function(dbRecipe) {
  //if we were able to find a recipe with the given id, send it back to the client
  res.json(dbRecipe);
})
.catch(function(err) {
  res.json(err);
});
});

//route for saving/updating a recipe's associate Note
app.post("/recipes/:id", function(req, res) {
  //create a new note and pass the req,body to the entry
  db.Note.create(req.body)
  .then(function(dbNote) {
    return db.Recipe.findOneAndUpdate({
      _id: req.params.id}, {note: dbNote._id}, {new: true});
  }).then(function(dbRecipe) {
    //if we were able to update a recipe send it to the client
    res.json(dbRecipe);
  })
  .catch(function(err) {
    //if an error, send it the client
    res.json(err);
  });
});

//start the server
app.listen(PORT, function() {
console.log("App running on port " + PORT + "!");
});

   