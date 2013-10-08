'use strict';

var Canvas = require('canvas');
var Image = Canvas.Image;
var http = require('http');
var url = require('url');

var crc32 	= require("easy-crc32");
var cp		  = require("colour-proximity");

exports.start = function() {

  var port = 8888;

  http.createServer(handler).listen(port);
  console.log("Avatar Server Running on", port);

  function handler (req, res) {

    var params = url.parse(req.url, true).query;
    console.log(params);

    params.h = params.t;
    params.t = (params.t || '?').substr(0, 1).toUpperCase();
    params.c = params.c || determineColor(params.h);
    params.s = Number(params.s) || 150;

    if (req.method === 'GET') {

      var canvas = new Canvas(params.s, params.s);
      var ctx = canvas.getContext('2d');

      drawAvatar(ctx, params.t, params.c);

//      var out = fs.createWriteStream(__dirname + '/dummy.png');
      var stream = canvas.createPNGStream();

      stream.on('data', function(chunk){
//        out.write(chunk);
        res.write(chunk);
      });

      stream.on('end', function(chunk) {
//        console.log('saved png');
        res.end(chunk);
      });

      // TODO: etag, maxAge

      res.writeHead(200, {
        'Content-Type': 'image/png'
      });


      return;

    }

    // didn't expected this
    var debugData = req.method + '  ' + req.url;
    console.log(debugData);
    res.writeHead(200);
    res.end(debugData);
  }

  function determineColor(string, avoid) {
    var crc = crc32.calculate(string);
   	var hex = crc.toString(16);

   	if(avoid !== undefined){
   		if(avoid.avoid !== undefined){
   			if(avoid.proximity === undefined){
   				avoid.proximity = '30';
   			}
   			for(var i=0;i<(hex.length-6);i++){
   				var sub = "#" + hex.substring(i, 6+i);
   				if(cp.proximity(avoid.avoid, sub)>avoid.proximity){
   					return sub;
   				}
   			}
   			//todo Error that a sufficiently far colour could not be calculated. To be honest, it should try something else, I don't know what though.
   		}
   	}

   	return "#" + hex.substring(0, 6);
  }

  function drawAvatar(ctx, initials, bgColor) {

    var height = ctx.canvas.height;
    var width = ctx.canvas.width;

    initials = initials || '?';
    bgColor = bgColor || 'rgb(155, 255, 115)';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.font = Math.round(height * 0.5) + 'pt Helvetica Neue';
    ctx.fillStyle = 'rgba(0, 0, 0, .5)';
    var textSize = ctx.measureText(initials);
    ctx.fillText(initials, (width - textSize.width)/2, (height + textSize.actualBoundingBoxAscent)/2);

    ctx.save();
  }

  function loadImg(imgURL, size) {
    var img = new Image();
    var start = new Date;

    img.onerror = function(err) {
      throw err;
    };

    img.onload = function() {
      var canvas = new Canvas(size, size);
      var ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, size, size);

      canvas.toBuffer(function(err, buf) {
        fs.writeFile(__dirname + '/resize.png', buf, function(){
          console.log('Resized and saved in %dms', new Date - start);
        });
      });
    };

    img.src = imgURL;
  }

};


