window.App = window.App || {};

App.state = {
  faces: [],      // [{ id, canvas, name }]
  topic: '',
  tiers: [],      // length 10: { type:'face'|'emoji', face|emoji, spriteCanvas, label }
  score: 0,
  bestScore: parseInt(localStorage.getItem('faceSuikaBest') || '0', 10) || 0,
  faceIdCounter: 0
};

App.nextFaceId = function () {
  App.state.faceIdCounter += 1;
  return 'face-' + App.state.faceIdCounter;
};

App.showScreen = function (name) {
  var screens = document.querySelectorAll('.screen');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('active');
  }
  var target = document.getElementById('screen-' + name);
  if (target) target.classList.add('active');
};

App.saveBestScore = function () {
  if (App.state.score > App.state.bestScore) {
    App.state.bestScore = App.state.score;
    localStorage.setItem('faceSuikaBest', String(App.state.bestScore));
  }
};

App.shuffle = function (arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
};
