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
    ctx.font = Math.round(diameter * 0.82) + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, diameter / 2, diameter / 2 * 1.05);
    return canvas;
  }

  function prepareAllTierSprites() {
    for (var i = 0; i < App.state.tiers.length; i++) {
      var t = App.state.tiers[i];
      if (t.type === 'face') {
        t.spriteCanvas = makeFaceSprite(t.face.canvas, i);
        t.label = t.face.name;
      } else {
        t.spriteCanvas = makeEmojiSprite(t.emoji, i);
        t.label = t.emoji;
      }
    }
  }

  return {
    makeFaceSprite: makeFaceSprite,
    makeEmojiSprite: makeEmojiSprite,
    prepareAllTierSprites: prepareAllTierSprites
  };
})();
