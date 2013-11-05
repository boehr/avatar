(function() {

  'use strict';

  var avatar = window.avatar = window.avatar || {};

  avatar.createCanvas = function(size) {
    var canvas = document.createElement('canvas');
    canvas.height = size;
    canvas.width = size;
    return canvas;
  };

  avatar.createImage = function(name, url, size) {

    var canvas = avatar.createCanvas(size);
    var color = avatar.determineColor(name);
    avatar.drawAvatar(canvas, name.toUpperCase().substr(0, 1), color);

    var img = new Image();
    img.height = size;
    img.width = size;

    img.onerror = function() {
      img.src = canvas.toDataURL();
    };
    
    url = avatar.validateURL(url, size);
    img.src = url || canvas.toDataURL();

    return img;

  };

}());
