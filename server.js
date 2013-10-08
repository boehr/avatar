'use strict';

var Canvas = require('canvas');
var Image = Canvas.Image;
var http = require('http');
var url = require('url');
var request = require('request');

var crc32 	= require("easy-crc32");
var cp		  = require("colour-proximity");

exports.start = function() {

  var port = 8888;

  http.createServer(handler).listen(port);
  console.log("Avatar Server Running on", port);

  function handler (req, res) {

    var params = url.parse(req.url, true).query || {};

    params.h = params.t || '?';
    params.c = params.c || determineColor2(params.h);
    params.t = (params.h).substr(0, 1).toUpperCase();
    params.s = Number(params.s) || 150;

    console.log(params);

    if (req.method === 'GET') {

      var afterLoadImage = function(canvas) {

        var stream = canvas ? canvas.createPNGStream() : drawAvatar(params);

        stream.on('data', function(chunk) {
          res.write(chunk);
        });

        stream.on('end', function(chunk) {
          res.end(chunk);
        });

        // TODO: etag, maxAge

        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Cache-Control': 'max-age=86400' /*24h*/
        });

      };

      if (params.u) {
        loadImg(params.u, params.s, afterLoadImage)
      } else {
        afterLoadImage(null);
      }

      return;

    }

    // didn't expected this
    var debugData = req.method + '  ' + req.url;
    console.log(debugData);
    res.writeHead(200);
    res.end(debugData);
  }

  function determineColor1(string, avoid) {
    var crc = crc32.calculate(string);
   	var hex = crc.toString(16);

   	if (avoid !== undefined) {
   		if (avoid.avoid !== undefined) {

        if (avoid.proximity === undefined) {
   				avoid.proximity = '30';
   			}

   			for (var i=0;i<(hex.length-6);i++) {
   				var sub = "#" + hex.substring(i, 6+i);
   				if (cp.proximity(avoid.avoid, sub) > avoid.proximity) {
   					return sub;
   				}
   			}
   			//todo Error that a sufficiently far colour could not be calculated. To be honest, it should try something else, I don't know what though.
   		}
   	}

   	return "#" + hex.substring(0, 6);
  }


  function djb2(str){
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
  }

  function determineColor2(str) {

    var hash = djb2(str);
    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
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
    console.log('loadImg', imgURL, size);

    request({ url: imgURL, encoding: 'binary' }, function (error, imageResponse, imageBody) {

        if (error) {
          callback(null);
          return;
        }

        var type    = imageResponse.headers["content-type"];
        var prefix  = "data:" + type + ";base64,";
        var base64  = new Buffer(imageBody, 'binary').toString('base64');
        var dataURI = prefix + base64;

        var img = new Image();

        img.onerror = function(err) {
          console.log('img.onerror', err);
          callback(null);
        };

        img.onload = function() {
          var canvas = new Canvas(size, size);
          var ctx = canvas.getContext('2d');

          ctx.patternQuality = "best";
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, size, size);

          callback(canvas, ctx);
        };

        img.src = dataURI;
      }
    );
  }

};


