window.App = window.App || {};

// Preloads tier artwork. Fruit images are optional: until image/tier1.png ...
// image/tier9.png exist, those tiers fall back to fruit emojis.
App.Assets = (function () {
  var images = { watermelon: null, tiers: [null, null, null, null, null, null, null, null, null] };
  var readyPromise = null;

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  function preload() {
    if (readyPromise) return readyPromise;
    var jobs = [
      loadImage(App.CONFIG.WATERMELON_IMAGE).then(function (img) { images.watermelon = img; })
    ];
    App.CONFIG.TIER_IMAGE_PATHS.forEach(function (src, i) {
      jobs.push(loadImage(src).then(function (img) { images.tiers[i] = img; }));
    });
    readyPromise = Promise.all(jobs);
    return readyPromise;
  }

  return { images: images, preload: preload };
})();
