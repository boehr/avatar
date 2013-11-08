(function() {

  'use strict';

  var http = require('http');
  var url = require('url');
  var crypto = require('crypto');
  var PngCrush = require('pngcrush');

  var Canvas = require('canvas');
  var Image = Canvas.Image;
  var request = require('request');

  var avatar = require('./avatar');

  // setup logging
  var winston = require('winston');
  var logger = new (winston.Logger)({
    transports: [
      new winston.transports.File({
        filename: 'log/debug.log',
        maxsize: 500000, /*500MB*/
        maxFiles: 3
      })
    ],
    exceptionHandlers: [
      new winston.transports.File({
        filename: 'log/error.log',
        maxsize: 500000, /*500MB*/
        maxFiles: 3
      })
    ],
    exitOnError: false // TODO [scthi]: re-check if this is the right choice
  });

  function loadImg(imgURL, size, callback) {
    // node canvas doesn't support remote urls for images, so we have to load the images by ourselves
    // and give it a data uri.
    request({ url: imgURL, encoding: 'binary' }, function (error, imageResponse, imageBody) {

      if (error) {
        logger.info('afterReq - image loading failed:', error);
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
      'Cache-Control': 'max-age=604800, public', /* one week */
      'ETag': etag
    });

    // image optimization
    stream = stream.pipe(new PngCrush(['-brute', '-rem', 'alla']));

    // pipe to response
    stream.pipe(res);

  }

  function handleRequest(req, res) {

    var params = url.parse(req.url, true).query || {};

    params.h = params.h || params.t || '?';
    params.c = params.c || avatar.determineColor(params.h);
    params.t = (params.t || params.h).substr(0, 1).toUpperCase();
    params.s = Number(params.s) || 150;

    var date = new Date();
    var etag = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304);
      res.end();
      return;
    }

    // if no image url is given, but the username/hash is an email
    // we try to load the corresponding gravatar pic
    if (!params.u && params.h.indexOf('@') !== -1) {
      var md5 = crypto.createHash('md5');
      md5.update(params.h);
      params.u = 'http://www.gravatar.com/avatar/' + md5.digest('hex') + '.png?s=' + params.s + '&d=404';
    }
    
    

    if (params.u) {

      params.u = avatar.validateURL(params.u);
      loadImg(params.u, params.s, afterLoadImage.bind(null, params, res, etag));

    } else {

      afterLoadImage(params, res, null);

    }
  }


  exports.start = function () {

    var port = process.argv[2] || 8888;

    http.createServer(handleRequest).listen(port);
    logger.info('Avatar Server Running on', port);

  };

}());



