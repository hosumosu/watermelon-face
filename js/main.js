window.App = window.App || {};

(function () {
  function bindGameOverButtons() {
    document.getElementById('btn-retry').addEventListener('click', function () {
      App.Game.start();
    });
    document.getElementById('btn-retopic').addEventListener('click', function () {
      App.showScreen('topic');
    });
    document.getElementById('btn-restart-all').addEventListener('click', function () {
      App.state.faces = [];
      App.state.tiers = [];
      App.state.topic = '';
      App.ScreenUpload.renderGallery();
      App.showScreen('upload');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    App.ScreenUpload.init();
    App.ScreenTopic.render();
    App.ScreenReveal.init();
    App.Game.initOnce();
    bindGameOverButtons();
    App.showScreen('upload');
  });
})();
