window.App = window.App || {};

// Persists cropped faces to localStorage so an uploaded set survives page
// reloads. Photos never leave the device — this is browser-local only.
App.FaceStore = (function () {
  var KEY = 'faceSuikaFaces';

  function save() {
    try {
      var payload = App.state.faces.map(function (f) {
        return { name: f.name, dataURL: f.canvas.toDataURL('image/png') };
      });
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (e) { /* quota or serialization failure — persistence is optional */ }
  }

  function load() {
    var payload;
    try {
      payload = JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) {
      payload = [];
    }
    if (!payload || !payload.length) return Promise.resolve([]);
    var jobs = payload.map(function (item) {
      return new Promise(function (resolve) {
        if (!item || !item.dataURL) return resolve(null);
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          canvas.getContext('2d').drawImage(img, 0, 0, 256, 256);
          resolve({ id: App.nextFaceId(), canvas: canvas, name: item.name || '얼굴' });
        };
        img.onerror = function () { resolve(null); };
        img.src = item.dataURL;
      });
    });
    return Promise.all(jobs).then(function (faces) {
      return faces.filter(function (f) { return f; });
    });
  }

  return { save: save, load: load };
})();
