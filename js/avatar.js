(function(exports) {

  'use strict';

  function djb2(str) {
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      /* hash * 33 + c */
    }
    return hash;
  }

  /**
   * In most browsers the ctx.measureText() method returns an object with only a width property on it. actualBoundingBoxAscent & actualBoundingBoxDescent are in the spec but not implemented yet by any browser. because of this only fonts of normal proportions will have correct height values, things like condensed fonts will be off. We measure the width of a upper-case M because many fonts base the size of other letters based on this character. http://en.wikipedia.org/wiki/Dash
   * @param {object} ctx
   * @param {String} text
   * @returns {{width: Number, height: Number}}
   */
  function measureText (ctx, text) {
    var metrics = ctx.measureText(text);
    var width = metrics.width;
    var height = metrics.actualBoundingBoxAscent || ctx.measureText('A').width;
    return  {
      width: width,
      height: height
    };
  }

  if (exports.window) { // special handling for browser mode
    exports = exports.window.avatar = exports.window.avatar || {};
  }

  exports.colors = [ '#672E47', '#FF737B', '#FF8473', '#FF9A73', '#FFAF73', '#FFC573', '#FFD473', '#FFE373', '#FFF273', '#F7FF73', '#C9FF73', '#9BFF73', '#73FF78', '#73FFA9', '#73FFE0', '#4994A3', '#73B0FF', '#7386FF', '#7E73FF', '#7153B9', '#BB73FF', '#AB54BC', '#666', '#999', '#bbb', '#ddd' ];

  exports.determineColor = function(str) {
    var hash = djb2(str);

    var idx = hash % exports.colors.length;
    return exports.colors[idx];

  };
  
  exports.validateURL = function(url, size) {
    
    if (url) {

      size = size || 150;
      var startIdx = url.indexOf('gravatar');
      if (startIdx !== -1) {
        
        startIdx = url.indexOf('?', startIdx);
        
        if (startIdx !== -1) {
          url = url.split('?').shift() + '?s=' + size + '&d=404';
        }
        
      }

      
    }
    
    return url;

  };

  exports.drawAvatar = function(canvas, initials, color) {

    var ctx = canvas.getContext('2d');

    var height = canvas.height;
    var width = canvas.width;

    initials = initials || '?';
    ctx.fillStyle = color || 'rgb(155, 255, 115)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = Math.round(height * 0.5) + 'pt Helvetica Neue';
    ctx.fillStyle = 'rgba(0, 0, 0, .5)';
    var textSize = measureText(ctx, initials);
    ctx.fillText(initials, (width - textSize.width) / 2, (height + textSize.height) / 2);

    ctx.save();

    return canvas;
  };

  exports.drawImage = function(url, img, canvas, callback) {

    img.onerror = function (err) {
      console.log('ERROR: img.onerror -', err);
      callback(null);
    };

    img.onload = function () {
      var ctx = canvas.getContext('2d');

      ctx.patternQuality = 'best';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      callback(canvas, ctx);
    };

    img.src = url;
  };

}(this));

