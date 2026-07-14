window.App = window.App || {};

App.Game = (function () {
  var CONFIG = App.CONFIG;
  var canvas, ctx;
  var engine, world;
  var balls = [];
  var mergeQueue = [];
  var running = false;
  var rafId = null;
  var lastFrameTime = 0;
  var accumulator = 0;
  var celebrateTimer = null;
  var dropLocked = false;
  var gameOverFlag = false;
  var currentDropTierIndex = 0;
  var nextDropTierIndex = 0;
  var aimX = CONFIG.BOARD_WIDTH / 2;
  var inputBound = false;
  var audioCtx = null;

  function setupCanvasSize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = CONFIG.BOARD_WIDTH * dpr;
    canvas.height = CONFIG.BOARD_HEIGHT * dpr;
    canvas.style.width = CONFIG.BOARD_WIDTH + 'px';
    canvas.style.height = CONFIG.BOARD_HEIGHT + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function playPop() {
    if (App.state.muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, audioCtx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) { /* audio not critical */ }
  }

  function randomDroppableTier() {
    var pool = CONFIG.DROPPABLE_TIERS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Renders a sprite into a small display canvas. Used instead of toDataURL
  // so sprites containing local image files still work on file:// (tainted
  // canvases can be drawn, just not exported).
  function spriteThumb(sprite, sizePx) {
    var c = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    c.width = Math.round(sizePx * dpr);
    c.height = Math.round(sizePx * dpr);
    c.style.width = sizePx + 'px';
    c.style.height = sizePx + 'px';
    c.getContext('2d').drawImage(sprite, 0, 0, c.width, c.height);
    return c;
  }

  function prepareNextDrop() {
    currentDropTierIndex = nextDropTierIndex;
    nextDropTierIndex = randomDroppableTier();
    var preview = document.getElementById('next-preview');
    if (preview && App.state.tiers[nextDropTierIndex]) {
      preview.innerHTML = '';
      preview.appendChild(spriteThumb(App.state.tiers[nextDropTierIndex].spriteCanvas, 30));
    }
  }

  function spawnBall(tierIndex, x, y, vx, vy) {
    var r = CONFIG.TIER_RADII[tierIndex];
    var body = Matter.Bodies.circle(x, y, r, {
      restitution: CONFIG.PHYSICS.restitution,
      friction: CONFIG.PHYSICS.friction,
      frictionStatic: CONFIG.PHYSICS.frictionStatic,
      frictionAir: CONFIG.PHYSICS.frictionAir,
      density: CONFIG.PHYSICS.density,
      label: 'ball'
    });
    body.plugin = { tierIndex: tierIndex, bornAt: now(), dangerTime: 0, merging: false };
    Matter.Body.setVelocity(body, { x: vx || 0, y: vy || 0 });
    Matter.World.add(world, body);
    balls.push(body);
    return body;
  }

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function onCollisionStart(event) {
    for (var i = 0; i < event.pairs.length; i++) {
      var pair = event.pairs[i];
      var a = pair.bodyA, b = pair.bodyB;
      if (a.label !== 'ball' || b.label !== 'ball') continue;
      if (!a.plugin || !b.plugin) continue;
      if (a.plugin.merging || b.plugin.merging) continue;
      if (a.plugin.tierIndex !== b.plugin.tierIndex) continue;
      if (a.plugin.tierIndex >= CONFIG.TIER_RADII.length - 1) continue;
      a.plugin.merging = true;
      b.plugin.merging = true;
      mergeQueue.push([a, b]);
    }
  }

  function removeBall(body) {
    Matter.World.remove(world, body);
    var idx = balls.indexOf(body);
    if (idx !== -1) balls.splice(idx, 1);
  }

  function processMergeQueue() {
    if (mergeQueue.length === 0) return;
    var queue = mergeQueue;
    mergeQueue = [];
    for (var i = 0; i < queue.length; i++) {
      var a = queue[i][0], b = queue[i][1];
      if (balls.indexOf(a) === -1 || balls.indexOf(b) === -1) continue;
      var newTier = a.plugin.tierIndex + 1;
      var midX = (a.position.x + b.position.x) / 2;
      var midY = (a.position.y + b.position.y) / 2;
      var r = CONFIG.TIER_RADII[newTier];
      var clampedX = Math.min(Math.max(midX, r), CONFIG.BOARD_WIDTH - r);
      removeBall(a);
      removeBall(b);
      spawnBall(newTier, clampedX, midY, 0, -1.5);
      if (newTier === CONFIG.TIER_RADII.length - 1) celebrateWatermelon();
      addScore(CONFIG.scoreForTier(newTier));
      playPop();
    }
  }

  function celebrateWatermelon() {
    var banner = document.getElementById('watermelon-banner');
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.classList.remove('pop');
    void banner.offsetWidth;
    banner.classList.add('pop');
    if (celebrateTimer) clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(function () { banner.classList.add('hidden'); }, 2600);
  }

  function updateDangerTimers(dt) {
    if (gameOverFlag) return;
    var nowT = now();
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      var topY = b.position.y - CONFIG.TIER_RADII[b.plugin.tierIndex];
      var inGrace = (nowT - b.plugin.bornAt) < CONFIG.SPAWN_GRACE_MS;
      if (!inGrace && topY < CONFIG.DANGER_Y) {
        b.plugin.dangerTime += dt;
        if (b.plugin.dangerTime > CONFIG.DANGER_TIME_MS) {
          triggerGameOver();
          return;
        }
      } else {
        b.plugin.dangerTime = 0;
      }
    }
  }

  function addScore(points) {
    App.state.score += points;
    var el = document.getElementById('score-val');
    if (el) el.textContent = String(App.state.score);
  }

  function triggerGameOver() {
    if (gameOverFlag) return;
    gameOverFlag = true;
    App.saveBestScore();
    var bestEl = document.getElementById('best-val');
    if (bestEl) bestEl.textContent = String(App.state.bestScore);
    var scoreLine = document.getElementById('gameover-score');
    if (scoreLine) scoreLine.textContent = '점수: ' + App.state.score;
    var overlay = document.getElementById('gameover-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideGameOverOverlay() {
    var overlay = document.getElementById('gameover-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function renderLadder() {
    var list = document.getElementById('ladder-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = App.state.tiers.length - 1; i >= 0; i--) {
      var t = App.state.tiers[i];
      var item = document.createElement('div');
      item.className = 'ladder-item';
      var thumb = spriteThumb(t.spriteCanvas, 22);
      var label = document.createElement('span');
      label.textContent = (i + 1) + '단계';
      item.appendChild(thumb);
      item.appendChild(label);
      list.appendChild(item);
    }
  }

  function clampX(x, r) {
    return Math.min(Math.max(x, r), CONFIG.BOARD_WIDTH - r);
  }

  function bindInput() {
    if (inputBound) return;
    inputBound = true;

    var aiming = false;

    function pointerXFromEvent(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      return (clientX - rect.left) * (CONFIG.BOARD_WIDTH / rect.width);
    }

    canvas.addEventListener('pointermove', function (e) {
      aimX = clampX(pointerXFromEvent(e), CONFIG.TIER_RADII[currentDropTierIndex]);
    });

    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (e2) {}
      aiming = true;
      aimX = clampX(pointerXFromEvent(e), CONFIG.TIER_RADII[currentDropTierIndex]);
    });

    canvas.addEventListener('pointerup', function (e) {
      if (!aiming) return;
      aimX = clampX(pointerXFromEvent(e), CONFIG.TIER_RADII[currentDropTierIndex]);
      aiming = false;
      dropCurrent();
    });

    canvas.addEventListener('pointercancel', function () {
      aiming = false;
    });

    canvas.style.touchAction = 'none';
  }

  function dropCurrent() {
    if (dropLocked || gameOverFlag || !running) return;
    dropLocked = true;
    var tierIndex = currentDropTierIndex;
    var r = CONFIG.TIER_RADII[tierIndex];
    var x = clampX(aimX, r);
    spawnBall(tierIndex, x, CONFIG.SPAWN_Y, 0, 0);
    prepareNextDrop();
    setTimeout(function () { dropLocked = false; }, CONFIG.DROP_COOLDOWN_MS);
  }

  function drawBoard() {
    ctx.clearRect(0, 0, CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);

    ctx.fillStyle = '#fff7ec';
    ctx.fillRect(0, 0, CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);

    ctx.strokeStyle = 'rgba(255,80,80,0.6)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.DANGER_Y);
    ctx.lineTo(CONFIG.BOARD_WIDTH, CONFIG.DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      var tier = App.state.tiers[b.plugin.tierIndex];
      if (!tier || !tier.spriteCanvas) continue;
      var sprite = tier.spriteCanvas;
      var r = CONFIG.TIER_RADII[b.plugin.tierIndex];
      var vr = r * CONFIG.BALL_VISUAL_SCALE;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.drawImage(sprite, -vr, -vr, vr * 2, vr * 2);
      ctx.restore();
    }

    if (!gameOverFlag) {
      var nextTier = App.state.tiers[currentDropTierIndex];
      if (nextTier && nextTier.spriteCanvas) {
        var previewR = CONFIG.TIER_RADII[currentDropTierIndex];
        var previewVr = previewR * CONFIG.BALL_VISUAL_SCALE;
        var sprite2 = nextTier.spriteCanvas;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.drawImage(sprite2, aimX - previewVr, CONFIG.SPAWN_Y - previewVr, previewVr * 2, previewVr * 2);
        ctx.restore();

        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(aimX, CONFIG.SPAWN_Y + previewR);
        ctx.lineTo(aimX, CONFIG.BOARD_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Fixed-timestep loop: rAF fires at the display's refresh rate (60/90/120Hz),
  // so physics must advance by real elapsed time, not once per frame.
  var FIXED_DT = 1000 / 60;

  function loop(timestamp) {
    if (!running) return;
    if (!lastFrameTime) lastFrameTime = timestamp;
    var elapsed = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (elapsed > 250) elapsed = 250;
    accumulator += elapsed;
    while (accumulator >= FIXED_DT) {
      Matter.Engine.update(engine, FIXED_DT);
      processMergeQueue();
      updateDangerTimers(FIXED_DT);
      accumulator -= FIXED_DT;
    }
    drawBoard();
    rafId = requestAnimationFrame(loop);
  }

  function initEngineAndWorld() {
    engine = Matter.Engine.create();
    engine.gravity.y = 1;
    engine.positionIterations = CONFIG.PHYSICS.positionIterations;
    engine.velocityIterations = CONFIG.PHYSICS.velocityIterations;
    engine.enableSleeping = false;
    world = engine.world;

    var w = CONFIG.BOARD_WIDTH, h = CONFIG.BOARD_HEIGHT;
    var wallOpts = { isStatic: true, label: 'wall', restitution: 0.1, friction: 0.5 };
    Matter.World.add(world, [
      Matter.Bodies.rectangle(w / 2, h + 25, w + 100, 50, wallOpts),
      Matter.Bodies.rectangle(-25, h / 2, 50, h + 200, wallOpts),
      Matter.Bodies.rectangle(w + 25, h / 2, 50, h + 200, wallOpts)
    ]);

    Matter.Events.on(engine, 'collisionStart', onCollisionStart);
  }

  function initOnce() {
    canvas = document.getElementById('game-canvas');
    setupCanvasSize();
    bindInput();
  }

  function start() {
    stop();
    initEngineAndWorld();
    balls = [];
    mergeQueue = [];
    dropLocked = false;
    gameOverFlag = false;
    App.state.score = 0;
    var scoreEl = document.getElementById('score-val');
    if (scoreEl) scoreEl.textContent = '0';
    var bestEl = document.getElementById('best-val');
    if (bestEl) bestEl.textContent = String(App.state.bestScore);
    var topicEl = document.getElementById('topic-banner');
    if (topicEl) topicEl.textContent = App.state.topic;
    hideGameOverOverlay();
    var banner = document.getElementById('watermelon-banner');
    if (banner) banner.classList.add('hidden');
    renderLadder();
    nextDropTierIndex = randomDroppableTier();
    prepareNextDrop();
    lastFrameTime = 0;
    accumulator = 0;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (engine) {
      Matter.Events.off(engine, 'collisionStart', onCollisionStart);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      engine = null;
      world = null;
    }
  }

  return {
    initOnce: initOnce,
    start: start,
    stop: stop
  };
})();
