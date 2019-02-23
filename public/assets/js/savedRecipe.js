$(document).ready(function() {
  function getArticles() {
    $.ajax({
      method: 'GET',
      url: '/articles'
    }).then(function(dbArticles) {
      dbArticles.forEach(article => {
        $('<li>')
          .addClass('list-group-item article')
          .append(article.title)
          .attr('data-id', article._id)
          .appendTo($('#articles'));
      });
    });
  }

  $('#articles').on('click', '.article', function() {

    const articleId = $(this).attr('data-id');
    $('#note-title').val('');
    $('#note-body').val('');
    
    $.ajax({
      url: `/articles/${articleId}`,
      method: 'GET'
    }).then(function(articleData) {
      console.log(articleData);
      $('#submit-note').attr('data-id', articleData._id).attr("data-note-id", articleData.note._id);
      $('#article-link')
        .attr('href', articleData.link)
        .text(articleData.title);
      $('#note-body').val(articleData.note.body);
      $('#note-title').val(articleData.note.title);
    });
  });

  $('#submit-note').on('click', function(e) {
    e.preventDefault();

    const articleId = $(this).attr('data-id');
    if (!articleId) {
      return false;
    }

    const noteData = {
      title: $('#note-title')
        .val()
        .trim(),
      body: $('#note-body')
        .val()
        .trim()
    };

    $.ajax({
      url: `/articles/${articleId}`,
      method: 'POST',
      data: noteData
    }).then(function(data) {
      console.log(data);
      $('#note-title').val('');
      $('#note-body').val('');
    });
  });

  getArticles();
});
