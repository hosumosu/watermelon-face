window.App = window.App || {};

App.ScreenReveal = (function () {
  var skip = false;
  var runToken = 0;

  function sleep(ms) {
    return new Promise(function (resolve) {
      if (skip) return resolve();
      setTimeout(resolve, ms);
    });
  }

  function buildCard(entry, isLast) {
    var card = document.createElement('div');
    card.className = 'reveal-card' + (isLast ? ' reveal-card-final' : '');

    var back = document.createElement('div');
    back.className = 'reveal-face-back';
    back.textContent = '?';

    var front = document.createElement('div');
    front.className = 'reveal-face-front hidden';
    var img = document.createElement('img');
    var caption = document.createElement('div');
    caption.className = 'reveal-caption';
    img.src = entry.face.canvas.toDataURL();
    caption.textContent = entry.rank + '위 · ' + entry.face.name;
    front.appendChild(img);
    front.appendChild(caption);

    card.appendChild(back);
    card.appendChild(front);
    return { card: card, back: back, front: front };
  }

  async function revealOne(entry, isLast, container) {
    var built = buildCard(entry, isLast);
    container.appendChild(built.card);
    built.card.classList.add('shaking');
    await sleep(isLast ? 2600 : 1400);
    built.card.classList.remove('shaking');
    built.back.classList.add('hidden');
    built.front.classList.remove('hidden');
    built.card.classList.add('revealed');
    if (isLast) built.card.classList.add('spotlight');
    await sleep(isLast ? 900 : 500);
  }

  async function runReveal() {
    var token = ++runToken;
    skip = false;
    var container = document.getElementById('reveal-cards');
    container.innerHTML = '';
    document.getElementById('reveal-topic-title').textContent = App.state.topic;
    document.getElementById('btn-reveal-continue').classList.add('hidden');
    document.getElementById('btn-reveal-skip').classList.remove('hidden');

    var entries = [];
    App.state.tiers.forEach(function (t) {
      if (t.type === 'face') entries.push({ face: t.face, rank: t.rank });
    });
    // Tiers ascend → ranks descend, so the punchline (1위) is revealed last.

    for (var i = 0; i < entries.length; i++) {
      if (token !== runToken) return;
      await revealOne(entries[i], i === entries.length - 1, container);
    }

    if (token !== runToken) return;
    document.getElementById('btn-reveal-skip').classList.add('hidden');
    document.getElementById('btn-reveal-continue').classList.remove('hidden');
  }

  function render() {
    runReveal();
  }

  function init() {
    document.getElementById('btn-reveal-skip').addEventListener('click', function () {
      skip = true;
    });
    document.getElementById('btn-reveal-continue').addEventListener('click', function () {
      App.Assets.preload().then(function () {
        App.Sprites.prepareAllTierSprites();
        App.showScreen('game');
        App.Game.start();
      });
    });
  }

  return { render: render, init: init };
})();
