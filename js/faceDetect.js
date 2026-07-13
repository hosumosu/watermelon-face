window.App = window.App || {};

App.FaceDetect = (function () {
  // Local bundled models first; CDN fallback covers file:// where local
  // fetch is blocked by the browser.
  var LOCAL_MODEL_URL = 'model';
  var CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
  var modelsLoaded = false;
  var modelLoadPromise = null;
  var OUT_SIZE = 256;

  function loadFrom(url) {
    return Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(url),
      faceapi.nets.faceLandmark68Net.loadFromUri(url)
    ]);
  }

  function loadModels() {
    if (modelsLoaded) return Promise.resolve();
    if (modelLoadPromise) return modelLoadPromise;
    modelLoadPromise = loadFrom(LOCAL_MODEL_URL)
      .catch(function () { return loadFrom(CDN_MODEL_URL); })
      .then(function () { modelsLoaded = true; })
      .catch(function (err) { modelLoadPromise = null; throw err; });
    return modelLoadPromise;
  }

  function fileToDownscaledCanvas(file, maxDim) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = function (e) {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  function detectFaces(sourceCanvas) {
    return loadModels().then(function () {
      var options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      return faceapi.detectAllFaces(sourceCanvas, options).withFaceLandmarks();
    }).then(function (results) {
      return results.map(function (r) {
        return { box: r.detection.box, landmarks: r.landmarks.positions };
      });
    });
  }

  function squareRegion(sourceCanvas, box, expand) {
    var cx = box.x + box.width / 2;
    var cy = box.y + box.height / 2;
    var side = Math.min(
      Math.max(box.width, box.height) * expand,
      sourceCanvas.width,
      sourceCanvas.height
    );
    var sx = Math.max(0, Math.min(cx - side / 2, sourceCanvas.width - side));
    var sy = Math.max(0, Math.min(cy - side / 2, sourceCanvas.height - side));
    return { sx: sx, sy: sy, side: side };
  }

  function drawRegionToCanvas(sourceCanvas, region) {
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(region.side));
    canvas.height = Math.max(1, Math.round(region.side));
    canvas.getContext('2d').drawImage(
      sourceCanvas, region.sx, region.sy, region.side, region.side,
      0, 0, canvas.width, canvas.height
    );
    return canvas;
  }

  function tracePolygonSmooth(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i <= points.length; i++) {
      var cur = points[i % points.length];
      var next = points[(i + 1) % points.length];
      var mid = { x: (cur.x + next.x) / 2, y: (cur.y + next.y) / 2 };
      ctx.quadraticCurveTo(cur.x, cur.y, mid.x, mid.y);
    }
    ctx.closePath();
  }

  function boundingBoxOf(points, padding, maxW, maxH) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(function (p) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(maxW, maxX + padding);
    maxY = Math.min(maxH, maxY + padding);
    return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
  }

  function containCrop(srcCanvas, bbox) {
    var out = document.createElement('canvas');
    out.width = OUT_SIZE;
    out.height = OUT_SIZE;
    var octx = out.getContext('2d');
    var scale = Math.min(OUT_SIZE / bbox.width, OUT_SIZE / bbox.height);
    var dw = bbox.width * scale, dh = bbox.height * scale;
    var dx = (OUT_SIZE - dw) / 2, dy = (OUT_SIZE - dh) / 2;
    octx.drawImage(srcCanvas, bbox.x, bbox.y, bbox.width, bbox.height, dx, dy, dw, dh);
    return out;
  }

  function applyMask(cropCanvas, maskCanvas) {
    var result = document.createElement('canvas');
    result.width = cropCanvas.width;
    result.height = cropCanvas.height;
    var rctx = result.getContext('2d');
    rctx.drawImage(cropCanvas, 0, 0);
    rctx.globalCompositeOperation = 'destination-in';
    rctx.drawImage(maskCanvas, 0, 0);
    rctx.globalCompositeOperation = 'source-over';
    return result;
  }

  function featheredMask(width, height, drawShape) {
    var maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    var mctx = maskCanvas.getContext('2d');
    try { mctx.filter = 'blur(3px)'; } catch (e) { /* unsupported, falls back to hard edge */ }
    mctx.fillStyle = '#fff';
    drawShape(mctx);
    mctx.fill();
    return maskCanvas;
  }

  // Cuts out a face along its jaw + brow-raised (approximate hairline) contour,
  // leaving a transparent background. Requires 68-point landmarks.
  function cutoutFace(sourceCanvas, box, landmarks, expand) {
    expand = expand || 1.4;
    var region = squareRegion(sourceCanvas, box, expand);
    var cropCanvas = drawRegionToCanvas(sourceCanvas, region);

    var jaw = landmarks.slice(0, 17).map(function (p) {
      return { x: p.x - region.sx, y: p.y - region.sy };
    });
    var browRaise = box.height * 0.35;
    var browOrder = [26, 25, 24, 23, 22, 21, 20, 19, 18, 17];
    var brow = browOrder.map(function (i) {
      var p = landmarks[i];
      return { x: p.x - region.sx, y: (p.y - region.sy) - browRaise };
    });
    var contour = jaw.concat(brow);

    var maskCanvas = featheredMask(cropCanvas.width, cropCanvas.height, function (mctx) {
      tracePolygonSmooth(mctx, contour);
    });
    var result = applyMask(cropCanvas, maskCanvas);
    var bbox = boundingBoxOf(contour, 6, result.width, result.height);
    return containCrop(result, bbox);
  }

  // Fallback for manual cropping when no landmarks are available: an elliptical
  // face-shaped mask instead of a hard rectangle.
  function cutoutEllipse(sourceCanvas, cx, cy, side) {
    var region = squareRegion(sourceCanvas, { x: cx - side / 2, y: cy - side / 2, width: side, height: side }, 1.0);
    var cropCanvas = drawRegionToCanvas(sourceCanvas, region);

    var rx = cropCanvas.width * 0.39;
    var ry = cropCanvas.height * 0.5;
    var ecx = cropCanvas.width / 2, ecy = cropCanvas.height / 2;

    var maskCanvas = featheredMask(cropCanvas.width, cropCanvas.height, function (mctx) {
      mctx.beginPath();
      mctx.ellipse(ecx, ecy, rx, ry, 0, 0, Math.PI * 2);
    });
    var result = applyMask(cropCanvas, maskCanvas);
    var bbox = boundingBoxOf([
      { x: ecx - rx, y: ecy - ry }, { x: ecx + rx, y: ecy + ry }
    ], 6, result.width, result.height);
    return containCrop(result, bbox);
  }

  return {
    loadModels: loadModels,
    fileToDownscaledCanvas: fileToDownscaledCanvas,
    detectFaces: detectFaces,
    cutoutFace: cutoutFace,
    cutoutEllipse: cutoutEllipse
  };
})();
