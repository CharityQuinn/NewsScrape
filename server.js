var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18KingArthurFlour", { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
//A get route for scaping 
app.get("/scrape", function(req, res) {
  //First we grab the body of the html with axios
  axios.get("https://www.kingarthurflour.com/recipes/").then(function (response) {
    //the we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    const recipeArr = [];
    // now we grab every li recipe-toprated-li tag, and do the folowing:
    $("recipe-curated-li").each(function (i, element) {
      //Save an empty result obleject
      var result = {};

      // add the label, text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .find("h5")
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

// Route for getting all Articles from the db
app.get("/recipes", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/recipes/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/recipes/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
