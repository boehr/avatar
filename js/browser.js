(function() {

  'use strict';

  var avatar = window.avatar = window.avatar || {};

  avatar.createImage = function(name, url, size) {

    var canvas = document.createElement('canvas');
    canvas.height = size;
    canvas.width = size;

    var color = avatar.determineColor('Thilo Schmalfuß');
    avatar.drawAvatar(canvas, 'T', color);

    var img = new Image();
    img.height = size;
    img.width = size;

    img.onerror = function() {
      img.src = canvas.toDataURL();
    };

    img.src = url ? url.split('?').shift() + '?s=' + size + '&d=404' : canvas.toDataURL();

    return img;

  };

}());
