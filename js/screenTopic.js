window.App = window.App || {};

App.ScreenTopic = (function () {
  var rendered = false;

  function assignTiers() {
    var total = App.CONFIG.TIER_COUNT;
    var n = App.state.faces.length;
    var tiers = new Array(total).fill(null);

    if (n > 0) {
      var lowerBound = Math.max(total - n - 2, 3);
      var candidates = [];
      for (var i = lowerBound; i < total; i++) candidates.push(i);
      while (candidates.length < n) {
        lowerBound--;
        candidates.unshift(lowerBound);
      }
      var shuffledCandidates = App.shuffle(candidates);
      var faceSlots = shuffledCandidates.slice(0, n).sort(function (a, b) { return a - b; });
      var shuffledFaces = App.shuffle(App.state.faces);

      faceSlots.forEach(function (tierIdx, idx) {
        tiers[tierIdx] = { type: 'face', face: shuffledFaces[idx] };
      });
    }

    for (var t = 0; t < total; t++) {
      if (!tiers[t]) {
        tiers[t] = { type: 'emoji', emoji: App.CONFIG.EMOJI_FALLBACK[t] };
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
