window.App = window.App || {};

(function () {
  function bindGameOverButtons() {
    document.getElementById('btn-retry').addEventListener('click', function () {
      App.Game.start();
    });
    document.getElementById('btn-retopic').addEventListener('click', function () {
      App.Game.stop();
      App.showScreen('topic');
    });
    document.getElementById('btn-restart-all').addEventListener('click', function () {
      App.Game.stop();
      App.state.faces = [];
      App.state.tiers = [];
      App.state.topic = '';
      App.ScreenUpload.renderGallery();
      App.showScreen('upload');
    });
  }

  function bindMuteButton() {
    var btn = document.getElementById('btn-mute');
    function refresh() { btn.textContent = App.state.muted ? '🔇' : '🔊'; }
    btn.addEventListener('click', function () {
      App.setMuted(!App.state.muted);
      refresh();
    });
    refresh();
  }

  document.addEventListener('DOMContentLoaded', function () {
    App.Assets.preload();
    bindMuteButton();
    App.ScreenUpload.init();
    App.ScreenTopic.render();
    App.ScreenReveal.init();
    App.Game.initOnce();
    bindGameOverButtons();
    App.showScreen('upload');
  });
})();
