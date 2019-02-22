$(document).ready(function() {
  // Getting a reference to the recipe container div we will be rendering all recipes inside of
  var recipeContainer = $(".recipe-container");
  // Adding event listeners for dynamically generated buttons for deleting recipes,
  // pulling up recipe notes, saving recipe notes, and deleting recipe notes
  $(document).on("click", ".btn.delete", handleRecipeDelete);
  $(document).on("click", ".btn.notes", handleRecipeNotes);
  $(document).on("click", ".btn.save", handleNoteSave);
  $(document).on("click", ".btn.note-delete", handleNoteDelete);
  $(".clear").on("click", handleRecipeClear);

  function initPage() {
    // Empty the Recipe container, run an AJAX request for any saved headlines
    $.get("/api/headlines?saved=true").then(function(data) {
      recipeContainer.empty();
      // If we have headlines, render them to the page
      if (data && data.length) {
        renderRecipes(data);
      } else {
        // Otherwise render a message explaining we have no Recipes
        renderEmpty();
      }
    });
  }

  function renderRecipes(recipes) {
    // This function handles appending HTML containing our recipe data to the page
    // We are passed an array of JSON containing all available recipes in our database
    var recipeCards = [];
    // We pass each recipe JSON object to the createCard function which returns a bootstrap
    // card with our recipe data inside
    for (var i = 0; i < recipes.length; i++) {
      recipeCards.push(createCard(recipes[i]));
    }
    // Once we have all of the HTML for the recipes stored in our recipeCards array,
    // append them to the recipeCards container
    recipeContainer.append(recipeCards);
  }

  function createCard(recipe) {
    // This function takes in a single JSON object for an recipe/headline
    // It constructs a jQuery element containing all of the formatted HTML for the
    // recipe card
    var card = $("<div class='card'>");
    var cardHeader = $("<div class='card-header'>").append(
      $("<h3>").append(
        $("<a class='recipe-link' target='_blank' rel='noopener noreferrer'>")
          .attr("href", recipe.url)
          .text(recipe.headline),
        $("<a class='btn btn-danger delete'>Delete From Saved</a>"),
        $("<a class='btn btn-info notes'>recipe Notes</a>")
      )
    );

    var cardBody = $("<div class='card-body'>").text(recipe.summary);

    card.append(cardHeader, cardBody);

    // We attach the recipe's id to the jQuery element
    // We will use this when trying to figure out which recipe the user wants to remove or open notes for
    card.data("_id", recipe._id);
    // We return the constructed card jQuery element
    return card;
  }

  function renderEmpty() {
    // This function renders some HTML to the page explaining we don't have any recipes to view
    // Using a joined array of HTML string data because it's easier to read/change than a concatenated string
    var emptyAlert = $(
      [
        "<div class='alert alert-warning text-center'>",
        "<h4>Uh Oh. Looks like we don't have any saved recipes.</h4>",
        "</div>",
        "<div class='card'>",
        "<div class='card-header text-center'>",
        "<h3>Would You Like to Browse Available recipes?</h3>",
        "</div>",
        "<div class='card-body text-center'>",
        "<h4><a href='/'>Browse recipes</a></h4>",
        "</div>",
        "</div>"
      ].join("")
    );
    // Appending this data to the page
    recipeContainer.append(emptyAlert);
  }

  function renderNotesList(data) {
    // This function handles rendering note list items to our notes modal
    // Setting up an array of notes to render after finished
    // Also setting up a currentNote variable to temporarily store each note
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
      // If we have no notes, just display a message explaining this
      currentNote = $("<li class='list-group-item'>No notes for this recipe yet.</li>");
      notesToRender.push(currentNote);
    } else {
      // If we do have notes, go through each one
      for (var i = 0; i < data.notes.length; i++) {
        // Constructs an li element to contain our noteText and a delete button
        currentNote = $("<li class='list-group-item note'>")
          .text(data.notes[i].noteText)
          .append($("<button class='btn btn-danger note-delete'>x</button>"));
        // Store the note id on the delete button for easy access when trying to delete
        currentNote.children("button").data("_id", data.notes[i]._id);
        // Adding our currentNote to the notesToRender array
        notesToRender.push(currentNote);
      }
    }
    // Now append the notesToRender to the note-container inside the note modal
    $(".note-container").append(notesToRender);
  }

  function handleRecipeDelete() {
    // This function handles deleting recipes/headlines
    // We grab the id of the recipe to delete from the card element the delete button sits inside
    var recipeToDelete = $(this)
      .parents(".card")
      .data();

    // Remove card from page
    $(this)
      .parents(".card")
      .remove();
    // Using a delete method here just to be semantic since we are deleting an recipe/headline
    $.ajax({
      method: "DELETE",
      url: "/api/headlines/" + recipeToDelete._id
    }).then(function(data) {
      // If this works out, run initPage again which will re-render our list of saved recipes
      if (data.ok) {
        initPage();
      }
    });
  }
  function handlerRecipeNotes(event) {
    // This function handles opening the notes modal and displaying our notes
    // We grab the id of the recipe to get notes for from the card element the delete button sits inside
    var currentRecipe = $(this)
      .parents(".card")
      .data();
    // Grab any notes with this Recipe id
    $.get("/api/notes/" + currentRecipe._id).then(function(data) {
      // Constructing our initial HTML to add to the notes modal
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Recipe: " + currentRecipe._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success save'>Save Note</button>")
      );
      // Adding the formatted HTML to the note modal
      bootbox.dialog({
        message: modalText,
        closeButton: true
      });
      var noteData = {
        _id: currentrecipe._id,
        notes: data || []
      };
      // Adding some information about the recipe and recipe notes to the save button for easy access
      // When trying to add a new note
      $(".btn.save").data("recipe", noteData);
      // renderNotesList will populate the actual note HTML inside of the modal we just created/opened
      renderNotesList(noteData);
    });
  }

  function handleNoteSave() {
    // This function handles what happens when a user tries to save a new note for an recipe
    // Setting a variable to hold some formatted data about our note,
    // grabbing the note typed into the input box
    var noteData;
    var newNote = $(".bootbox-body textarea")
      .val()
      .trim();
    // If we actually have data typed into the note input field, format it
    // and post it to the "/api/notes" route and send the formatted noteData as well
    if (newNote) {
      noteData = { _headlineId: $(this).data("recipe")._id, noteText: newNote };
      $.post("/api/notes", noteData).then(function() {
        // When complete, close the modal
        bootbox.hideAll();
      });
    }
  }

  function handleNoteDelete() {
    // This function handles the deletion of notes
    // First we grab the id of the note we want to delete
    // We stored this data on the delete button when we created it
    var noteToDelete = $(this).data("_id");
    // Perform an DELETE request to "/api/notes/" with the id of the note we're deleting as a parameter
    $.ajax({
      url: "/api/notes/" + noteToDelete,
      method: "DELETE"
    }).then(function() {
      // When done, hide the modal
      bootbox.hideAll();
    });
  }

  function handleRecipeClear() {
    $.get("api/clear")
      .then(function() {
        recipeContainer.empty();
        initPage();
      });
  }
});