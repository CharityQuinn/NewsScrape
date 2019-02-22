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
mongoose.connect("mongodb://localhost/RecipeScraper-18", { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("www.kingarthurflour.com/recipes/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    $('.recipe-toprated-li').each(function(i, element) {
      const name = $(element)
        .find('figure')
        .find('h5')
        .text();
   
      const link = $(element)
        .find('a')
        .attr('href');
        // Save an empty result object
        var result = {};
        
        // Add the text and href of every link, and save them as properties of the result object
        result.name = $(this)
        .children("a")
        .text();
        result.link = $(this)
        .children("a")
        .attr("href");
      

      // Create a new Recipe using the `result` object built from scraping
      db.Recipe.create(result)
        .then(function(dbRecipe) {
          // View the added result in the console
          console.log(dbRecipe);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Recipes from the db
app.get("/recipes", function(req, res) {
  // Grab every document in the Recipes collection
  db.Recipe.find({})
    .then(function(dbRecipe) {
      // If we were able to successfully find Recipes, send them back to the client
      res.json(dbRecipe);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Recipe by id, populate it with it's note
app.get("/recipes/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Recipe.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbRecipe) {
      // If we were able to successfully find an Recipe with the given id, send it back to the client
      res.json(dbRecipe);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Recipe's associated Note
app.post("/recipes/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Recipe with an `_id` equal to `req.params.id`. Update the Recipe to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Recipe.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbRecipe) {
      // If we were able to successfully update an Recipe, send it back to the client
      res.json(dbRecipe);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
