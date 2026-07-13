window.App = window.App || {};

App.ScreenTopic = (function () {
  var rendered = false;

  function assignTiers() {
    var total = App.CONFIG.TIER_COUNT;
    var tiers = new Array(total).fill(null);

    // The final tier is always the watermelon.
    tiers[total - 1] = { type: 'watermelon' };

    // Faces land on random tiers among 1~9 (index 0~8); at most 9 are used.
    var faces = App.shuffle(App.state.faces).slice(0, total - 1);
    var slots = [];
    for (var i = 0; i < total - 1; i++) slots.push(i);
    slots = App.shuffle(slots).slice(0, faces.length);
    slots.forEach(function (tierIdx, idx) {
      tiers[tierIdx] = { type: 'face', face: faces[idx] };
    });

    // Remaining tiers use the fixed fruit lineup.
    for (var t = 0; t < total - 1; t++) {
      if (!tiers[t]) {
        tiers[t] = { type: 'fruit', fruitIndex: t };
      }
    }

    App.state.tiers = tiers;
  }

  function render() {
    if (rendered) return;
    rendered = true;

    var presetWrap = document.getElementById('topic-presets');
    App.CONFIG.TOPIC_PRESETS.forEach(function (topic) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-preset-btn';
      btn.textContent = topic;
      btn.addEventListener('click', function () {
        startWithTopic(topic);
      });
      presetWrap.appendChild(btn);
    });

    document.getElementById('btn-custom-topic').addEventListener('click', function () {
      var input = document.getElementById('custom-topic-input');
      var value = input.value.trim();
      if (value) startWithTopic(value);
    });
  }

  function startWithTopic(topic) {
    App.state.topic = topic;
    assignTiers();
    App.ScreenReveal.render();
    App.showScreen('reveal');
  }

  return { render: render, assignTiers: assignTiers };
})();
