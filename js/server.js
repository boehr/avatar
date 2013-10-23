'use strict';

var http = require('http');
var url = require('url');
var PngCrush = require('pngcrush');

var Canvas = require('canvas');
var Image = Canvas.Image;
var request = require('request');

var avatar = require('./avatar');


function loadImg(imgURL, size, callback) {
  // node canvas doesn't support remote urls for images, so we have to load the images by ourselves
  // and give it a data uri.
  request({ url: imgURL, encoding: 'binary' }, function (error, imageResponse, imageBody) {

    if (error) {
      console.log('ERROR: afterReq -', error);
      callback(null);
      return;
    }

    if (imageResponse.statusCode === 404) { // image does not exist
      callback(null);
      return;
    }

    var type = imageResponse.headers['content-type'];
    var prefix = 'data:' + type + ';base64,';
    var base64 = new Buffer(imageBody, 'binary').toString('base64'); // TODO [scthi]: use a pool of buffers
    var dataURI = prefix + base64;

    avatar.drawImage(dataURI, new Image(), new Canvas(size, size), callback);

  });
}

function afterLoadImage(params, res, etag, canvas) {

  canvas = canvas || avatar.drawAvatar(new Canvas(params.s, params.s), params.t, params.c);
  var stream = canvas.createPNGStream();

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

function handleRequest(req, res) {

  var params = url.parse(req.url, true).query || {};

  params.h = params.t || '?';
  params.c = params.c || avatar.determineColor(params.h);
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


exports.start = function () {

  var port = process.argv[2] || 8888;

  http.createServer(handleRequest).listen(port);
  console.log('INFO: Avatar Server Running on', port);

};


