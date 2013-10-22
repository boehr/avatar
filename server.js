'use strict';

var http     = require('http');
var url      = require('url');
                                                                                 s
var Canvas   = require('canvas');
var Image    = Canvas.Image;

var request  = require('request');
var PngCrush = require('pngcrush');

exports.start = function() {

  var port = process.argv[2] || 8888;

  http.createServer(handler).listen(port);
  console.log('INFO: Avatar Server Running on', port);

  function handler (req, res) {

    var params = url.parse(req.url, true).query || {};

    params.h = params.t || '?';
    params.c = params.c || determineColor(params.h);
    params.t = (params.h).substr(0, 1).toUpperCase();
    params.s = Number(params.s) || 150;

    var date = new Date();
    var etag = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304);
      res.end();
      return;
    }

    if (params.u) {

      if (params.u.indexOf('gravatar') !== -1) {
        params.u = params.u.split('?').shift() + '?s=' + params.s + '&d=404';
      }

      loadImg(params.u, params.s, afterLoadImage.bind(this, params, res, etag))

    } else {

      afterLoadImage(params, res, null);

    }
  }

  function afterLoadImage(params, res, etag, canvas) {

    var stream = canvas ? canvas.createPNGStream() : drawAvatar(params);

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'max-age=86400, public', /*24h*/
      'ETag': etag
    });

    // image optimization
    stream = stream.pipe(new PngCrush(['-brute', '-rem', 'alla']));

    // pipe to response
    stream.pipe(res);

  }

  function djb2(str){
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
  }

  function determineColor(str) {

    var hash = djb2(str);
    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return '#' + ('0' + r.toString(16)).substr(-2) + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
  }

  function drawAvatar(params) {

    var canvas = new Canvas(params.s, params.s);
    var ctx = canvas.getContext('2d');

    var height = params.s;
    var width = params.s;

    var initials = params.t || '?';
    ctx.fillStyle = params.c || 'rgb(155, 255, 115)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = Math.round(height * 0.5) + 'pt Helvetica Neue';
    ctx.fillStyle = 'rgba(0, 0, 0, .5)';
    var textSize = ctx.measureText(initials);
    ctx.fillText(initials, (width - textSize.width)/2, (height + textSize.actualBoundingBoxAscent)/2);

    ctx.save();

    return canvas.createPNGStream();
  }

  function loadImg(imgURL, size, callback) {
//    console.log('INFO: loadImg', imgURL, size);

    request({ url: imgURL, encoding: 'binary' }, function (error, imageResponse, imageBody) {

        if (error) {
          console.error('ERROR: afterReq -', error);
          callback(null);
          return;
        }

        if (imageResponse.statusCode === 404) { // image does not exist
          callback(null);
          return;
        }

        var type    = imageResponse.headers['content-type'];
        var prefix  = 'data:' + type + ';base64,';
        var base64  = new Buffer(imageBody, 'binary').toString('base64'); // TODO [scthi]: use a pool of buffers
        var dataURI = prefix + base64;

        var img = new Image();

        img.onerror = function(err) {
          console.error('ERROR: img.onerror -', err);
          callback(null);
        };

        img.onload = function() {
          var canvas = new Canvas(size, size);
          var ctx = canvas.getContext('2d');

          ctx.patternQuality = 'best';
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, size, size);

          callback(canvas, ctx);
        };

        img.src = dataURI;
      }
    );
  }

};


