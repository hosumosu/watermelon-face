window.App = window.App || {};

App.ScreenUpload = (function () {
  var manualCropActive = false;

  function setStatus(text) {
    var el = document.getElementById('upload-status');
    if (el) el.textContent = text || '';
  }

  function showLoading(message) {
    var msg = document.getElementById('loading-message');
    if (msg && message) msg.textContent = message;
    var overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    var overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function addFaceToGallery(cropCanvas) {
    var face = {
      id: App.nextFaceId(),
      canvas: cropCanvas,
      name: '얼굴 ' + (App.state.faces.length + 1)
    };
    App.state.faces.push(face);
    renderGallery();
  }

  function renderGallery() {
    var gallery = document.getElementById('face-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    App.state.faces.forEach(function (face) {
      var card = document.createElement('div');
      card.className = 'face-card';

      var img = document.createElement('img');
      img.src = face.canvas.toDataURL();

      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'face-name';
      nameInput.value = face.name;
      nameInput.addEventListener('input', function () {
        face.name = nameInput.value || face.name;
      });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = '×';
      delBtn.className = 'face-del';
      delBtn.addEventListener('click', function () {
        App.state.faces = App.state.faces.filter(function (f) { return f.id !== face.id; });
        renderGallery();
      });

      card.appendChild(img);
      card.appendChild(nameInput);
      card.appendChild(delBtn);
      gallery.appendChild(card);
    });

    var nextBtn = document.getElementById('btn-to-topic');
    if (nextBtn) nextBtn.disabled = App.state.faces.length === 0;

    var limitNote = document.getElementById('face-limit-note');
    if (limitNote) limitNote.classList.toggle('hidden', App.state.faces.length <= 9);
  }

  function openManualCropForCanvas(sourceCanvas) {
    if (manualCropActive) {
      setStatus('먼저 열려 있는 크롭 작업을 완료해주세요.');
      return Promise.resolve();
    }
    manualCropActive = true;
    return new Promise(function (resolve) {
      var panel = document.getElementById('manual-crop-panel');
      var mcanvas = document.getElementById('manual-canvas');
      var sizeInput = document.getElementById('manual-size');
      var addBtn = document.getElementById('manual-add-btn');
      var doneBtn = document.getElementById('manual-done-btn');
      panel.classList.remove('hidden');

      var maxW = 340;
      var scale = Math.min(1, maxW / sourceCanvas.width);
      mcanvas.width = Math.max(1, Math.round(sourceCanvas.width * scale));
      mcanvas.height = Math.max(1, Math.round(sourceCanvas.height * scale));
      var mctx = mcanvas.getContext('2d');

      var center = { x: mcanvas.width / 2, y: mcanvas.height / 2 };

      function redraw() {
        mctx.clearRect(0, 0, mcanvas.width, mcanvas.height);
        mctx.drawImage(sourceCanvas, 0, 0, mcanvas.width, mcanvas.height);
        var size = parseInt(sizeInput.value, 10) * scale;
        mctx.strokeStyle = '#ff5050';
        mctx.lineWidth = 2;
        mctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size);
      }
      redraw();

      function onPointer(e) {
        e.preventDefault();
        var rect = mcanvas.getBoundingClientRect();
        var clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
        var clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
        center.x = (clientX - rect.left) * (mcanvas.width / rect.width);
        center.y = (clientY - rect.top) * (mcanvas.height / rect.height);
        redraw();
      }

      function onAdd() {
        var size = parseInt(sizeInput.value, 10);
        var srcCx = center.x / scale;
        var srcCy = center.y / scale;
        var cropped = App.FaceDetect.cutoutEllipse(sourceCanvas, srcCx, srcCy, size);
        addFaceToGallery(cropped);
      }

      function onDone() {
        cleanup();
        resolve();
      }

      function cleanup() {
        manualCropActive = false;
        panel.classList.add('hidden');
        mcanvas.removeEventListener('pointerdown', onPointer);
        sizeInput.removeEventListener('input', redraw);
        addBtn.removeEventListener('click', onAdd);
        doneBtn.removeEventListener('click', onDone);
      }

      mcanvas.style.touchAction = 'none';
      mcanvas.addEventListener('pointerdown', onPointer);
      sizeInput.addEventListener('input', redraw);
      addBtn.addEventListener('click', onAdd);
      doneBtn.addEventListener('click', onDone);
    });
  }

  function processFile(file) {
    showLoading('얼굴을 찾는 중이에요…');
    setStatus('');
    return App.FaceDetect.fileToDownscaledCanvas(file, 1280)
      .catch(function () {
        hideLoading();
        setStatus('이미지를 불러올 수 없습니다.');
        return Promise.reject(new Error('load-failed'));
      })
      .then(function (canvas) {
        return App.FaceDetect.detectFaces(canvas)
          .catch(function () {
            hideLoading();
            setStatus('자동 얼굴 인식을 사용할 수 없어요 (인터넷 연결을 확인해주세요). 직접 잘라주세요.');
            return openManualCropForCanvas(canvas).then(function () {
              setStatus('');
              return null;
            });
          })
          .then(function (detections) {
            if (detections === null) return;
            hideLoading();
            if (detections.length === 0) {
              setStatus('이 사진에서 얼굴을 찾지 못했어요. 직접 잘라주세요.');
              return openManualCropForCanvas(canvas).then(function () {
                setStatus('');
              });
            }
            detections.forEach(function (d) {
              var cropped = App.FaceDetect.cutoutFace(canvas, d.box, d.landmarks, 1.4);
              addFaceToGallery(cropped);
            });
            setStatus('얼굴 ' + detections.length + '개를 찾았어요!');
          });
      })
      .catch(function () { hideLoading(); /* already reported via setStatus */ });
  }

  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList);
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () { return processFile(file); });
    });
    return chain;
  }

  function handleManualFile(file) {
    showLoading('사진을 불러오는 중이에요…');
    return App.FaceDetect.fileToDownscaledCanvas(file, 1280)
      .then(function (canvas) {
        hideLoading();
        return openManualCropForCanvas(canvas);
      })
      .catch(function () {
        hideLoading();
        setStatus('이미지를 불러올 수 없습니다.');
      });
  }

  function init() {
    var fileInput = document.getElementById('file-input');
    document.getElementById('btn-upload').addEventListener('click', function () {
      fileInput.click();
    });
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length) {
        handleFiles(e.target.files);
        fileInput.value = '';
      }
    });

    var manualFileInput = document.getElementById('manual-file-input');
    var manualModeBtn = document.getElementById('btn-manual-mode');
    manualModeBtn.addEventListener('click', function () {
      manualFileInput.click();
    });
    manualFileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files.length) {
        handleManualFile(e.target.files[0]);
        manualFileInput.value = '';
      }
    });

    document.getElementById('btn-to-topic').addEventListener('click', function () {
      if (App.state.faces.length > 0) {
        App.ScreenTopic.render();
        App.showScreen('topic');
      }
    });

    // Warm up the detection models in the background so the first photo
    // doesn't stall on the model download.
    App.FaceDetect.loadModels().catch(function () { /* reported on use */ });

    renderGallery();
  }

  return { init: init, renderGallery: renderGallery };
})();
