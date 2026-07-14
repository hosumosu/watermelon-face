window.App = window.App || {};

App.Sprites = (function () {
  function tierDiameter(tierIndex) {
    var baseR = App.CONFIG.TIER_RADII[tierIndex];
    var dpr = window.devicePixelRatio || 1;
    return Math.round(baseR * 2 * dpr * 2);
  }

  function makeFaceSprite(faceCanvas, tierIndex) {
    var diameter = tierDiameter(tierIndex);
    var canvas = document.createElement('canvas');
    canvas.width = diameter;
    canvas.height = diameter;
    canvas.getContext('2d').drawImage(faceCanvas, 0, 0, diameter, diameter);
    return canvas;
  }

  function makeEmojiSprite(emoji, tierIndex) {
    var diameter = tierDiameter(tierIndex);
    var canvas = document.createElement('canvas');
    canvas.width = diameter;
    canvas.height = diameter;
    var ctx = canvas.getContext('2d');
    // Drawn deliberately small so no glyph clips the canvas; the fill level
    // is unified afterwards by normalizeSpriteFill.
    ctx.font = Math.round(diameter * 0.8) + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, diameter / 2, diameter / 2);
    return canvas;
  }

  // Rescales a sprite so its opaque content exactly fills the canvas.
  // Different sources (emoji glyphs, face cutouts, photos) leave different
  // margins, which made ball art sit inconsistently against the physics
  // circle — some touching, some with visible gaps. Returns the canvas
  // unchanged when pixel access is blocked (tainted canvas on file://).
  function normalizeSpriteFill(canvas, fill) {
    var w = canvas.width, h = canvas.height;
    var data;
    try {
      data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    } catch (e) {
      return canvas;
    }
    var minX = w, minY = h, maxX = -1, maxY = -1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 16) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return canvas;
    var bw = maxX - minX + 1, bh = maxY - minY + 1;
    var scale = (Math.min(w, h) * fill) / Math.max(bw, bh);
    var out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    var dw = bw * scale, dh = bh * scale;
    out.getContext('2d').drawImage(
      canvas, minX, minY, bw, bh,
      (w - dw) / 2, (h - dh) / 2, dw, dh
    );
    return out;
  }

  // Removes the white background that surrounds artwork like the watermelon
  // drawing: flood-fills near-white pixels connected to the border so interior
  // highlights survive. Falls back to a circular clip when pixel access is
  // blocked (tainted canvas on file://).
  function stripWhiteBackground(canvas) {
    var w = canvas.width, h = canvas.height;
    var ctx = canvas.getContext('2d');
    try {
      var imageData = ctx.getImageData(0, 0, w, h);
      var px = imageData.data;
      var THRESHOLD = 235;
      function isWhite(idx) {
        return px[idx + 3] === 0 ||
          (px[idx] > THRESHOLD && px[idx + 1] > THRESHOLD && px[idx + 2] > THRESHOLD);
      }
      var visited = new Uint8Array(w * h);
      var queue = [];
      for (var x = 0; x < w; x++) { queue.push(x); queue.push((h - 1) * w + x); }
      for (var y = 0; y < h; y++) { queue.push(y * w); queue.push(y * w + w - 1); }
      while (queue.length) {
        var p = queue.pop();
        if (visited[p]) continue;
        visited[p] = 1;
        if (!isWhite(p * 4)) continue;
        px[p * 4 + 3] = 0;
        var py = (p / w) | 0, pxx = p % w;
        if (pxx > 0) queue.push(p - 1);
        if (pxx < w - 1) queue.push(p + 1);
        if (py > 0) queue.push(p - w);
        if (py < h - 1) queue.push(p + w);
      }
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    } catch (e) {
      var clipped = document.createElement('canvas');
      clipped.width = w;
      clipped.height = h;
      var cctx = clipped.getContext('2d');
      cctx.beginPath();
      cctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2);
      cctx.clip();
      cctx.drawImage(canvas, 0, 0);
      return clipped;
    }
  }

  function makeImageSprite(img, tierIndex) {
    var diameter = tierDiameter(tierIndex);
    var canvas = document.createElement('canvas');
    canvas.width = diameter;
    canvas.height = diameter;
    var ctx = canvas.getContext('2d');
    var scale = Math.min(diameter / img.naturalWidth, diameter / img.naturalHeight);
    var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (diameter - dw) / 2, (diameter - dh) / 2, dw, dh);
    return stripWhiteBackground(canvas);
  }

  function prepareAllTierSprites() {
    for (var i = 0; i < App.state.tiers.length; i++) {
      var t = App.state.tiers[i];
      if (t.type === 'face') {
        t.spriteCanvas = makeFaceSprite(t.face.canvas, i);
        t.label = t.face.name;
      } else if (t.type === 'watermelon') {
        var wm = App.Assets.images.watermelon;
        t.spriteCanvas = wm ? makeImageSprite(wm, i) : makeEmojiSprite('🍉', i);
        t.label = '수박';
      } else {
        var fruitImg = App.Assets.images.tiers[t.fruitIndex];
        var emoji = App.CONFIG.TIER_FRUIT_EMOJI[t.fruitIndex];
        t.spriteCanvas = fruitImg ? makeImageSprite(fruitImg, i) : makeEmojiSprite(emoji, i);
        t.label = emoji;
      }
      t.spriteCanvas = normalizeSpriteFill(t.spriteCanvas, 0.98);
    }
  }

  return {
    makeFaceSprite: makeFaceSprite,
    makeEmojiSprite: makeEmojiSprite,
    makeImageSprite: makeImageSprite,
    prepareAllTierSprites: prepareAllTierSprites
  };
})();
