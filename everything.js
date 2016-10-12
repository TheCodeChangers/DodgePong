/*
  CodeChangers Graphics Library 0.2

  Developed by Ridley Larsen for CodeChangers. It is provided without warranty.

  This library is licensed under the Creative Commons CC-BY-SA.
  More details about the license can be found at this URL:
    https://creativecommons.org/licenses/by-sa/2.0/
*/
var canvas, ctx, fillMode;
var canvases = document.getElementsByTagName('canvas');
var stop = false;

if (canvases.length > 1) {
  console.log("There is more than one canvas on the page. " +
    "You will need to use start(canvas) to use the graphics library."
  );
} else {
  canvas = canvases[0];
}





var walls = []
var balls = []



function magnitude(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
}

function normalize(x, y) {
  var mag = magnitude(x, y)
  return [x / mag, y / mag]
}



function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
    if (denom === 0) {
        return null;
    }
    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
    return {
        x: x1 + ua*(x2 - x1),
        y: y1 + ua*(y2 - y1),
        seg1: ua >= 0 && ua <= 1,
        seg2: ub >= 0 && ua <= 1
    };
}




function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) { // http://jsfiddle.net/justin_c_rounds/Gd2S2/
  // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
  var denominator, a, b, numerator1, numerator2, result = {
    x: null,
    y: null,
    onLine1: false,
    onLine2: false
  };
  denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
  if (denominator === 0) {
    return result;
  }
  a = line1StartY - line2StartY;
  b = line1StartX - line2StartX;
  numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
  numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
  a = numerator1 / denominator;
  b = numerator2 / denominator;

  // if we cast these lines infinitely in both directions, they intersect here:
  result.x = line1StartX + (a * (line1EndX - line1StartX));
  result.y = line1StartY + (a * (line1EndY - line1StartY));
  /*
          // it is worth noting that this should be the same as:
          x = line2StartX + (b * (line2EndX - line2StartX));
          y = line2StartX + (b * (line2EndY - line2StartY));
          */
  // if line1 is a segment and line2 is infinite, they intersect if:
  if (a > 0 && a < 1) {
    result.onLine1 = true;
  }
  // if line2 is a segment and line1 is infinite, they intersect if:
  if (b > 0 && b < 1) {
    result.onLine2 = true;
  }
  // if line1 and line2 are segments, they intersect if both of the above are true
  return result;
}


function createWall(data) { // OOP ftw

  var tb = {};

  tb.x1 = data.x1;
  tb.y1 = data.y1;
  tb.x2 = data.x2;
  tb.y2 = data.y2;


  tb.calculateNormals = function() { // calculate normal of line

    var normalY = tb.x2 - tb.x1
    var normalX = tb.y1 - tb.y2
    var normalLength = Math.sqrt(normalX * normalX + normalY * normalY)
    normalX = normalX / normalLength
    normalY = normalY / normalLength
    return [normalX, normalY]
  }

  tb.drawWall = function() {

    drawLine(tb.x1, tb.y1, tb.x2, tb.y2);

  }



  walls[walls.length] = tb



  return tb
}



function createBall(data) {
  // returns a ball array object


  var tb = {}; // ball object

  tb.x = data.x;
  tb.y = data.y;
  tb.vx = data.vx;
  tb.vy = data.vy;

  tb.setPosition = function(x, y) { // just faster than manually doing it
    tb.x = x;
    tb.y = y;
  }

  tb.setVelocity = function(x, y) { // and because functions are prettier
    tb.vx = x;
    tb.vy = y;
  }

  tb.updatePosition = function() { // changes position to position + velocity
    tb.x += tb.vx;
    tb.y += tb.vy;
  }

  tb.calculateSpeed = function() { // returns a number value of the velocity

    return magnitude(tb.vx, tb.vy);

  }


  tb.drawBall = function() {
    drawCircle(tb.x, tb.y, 3);
  }

  tb.checkCollisionCourse = function() {

    // return [collisionX, collisionY, distanceToWall, wall] or false

    var go = true
    var count = 0
    var returnThis = false
    for (var i = walls.length - 1; i >= 0; i--) {

      count += 1
      if (go === false) {
        break
      }
      var wall = walls[i]

      var wx1 = wall.x1
      var wy1 = wall.y1
      var wx2 = wall.x2
      var wy2 = wall.y2


      var bx1 = tb.x
      var by1 = tb.y
      var bx2 = tb.x + tb.vx 
      var by2 = tb.y + tb.vy 

      var results = checkLineIntersection(wx1, wy1, wx2, wy2, bx1, by1, bx2, by2)
      if (results.onLine1 && results.onLine2) {
        var sendBack = [
          results.x, // collisionX
          results.y, // collisionY
          magnitude(results.x - tb.x, results.y - tb.y), // distanceToWall
          wall // wall
        ]

        go = false
        return sendBack
      }
    }

    return returnThis
  }

  tb.getBounceDirection = function(intersectX, intersectY, normalX, normalY) { // http://stackoverflow.com/questions/30970103/2d-line-reflection-on-a-mirror

    //console.log(intersectX, intersectY, normalX, normalY, distance);

    var dx = tb.vx // tb.calculateSpeed()
    var dy = tb.vy // tb.calculateSpeed()



    var dotProduct = (dx * normalX) + (dy * normalY)

    var dotNormalX = dotProduct * normalX
    var dotNormalY = dotProduct * normalY

    var reflectedRayTipX = (intersectX + dx) - (dotNormalX * 2)
    var reflectedRayTipY = (intersectY + dy) - (dotNormalY * 2)

    return [reflectedRayTipX, reflectedRayTipY]

  }


  tb.step = function() {
    var collisionData = tb.checkCollisionCourse();


    if (collisionData !== false) {
      //console.log('collision!')
      var collisionX = collisionData[0]
      var collisionY = collisionData[1]
      var distance = collisionData[2]
      var wall = collisionData[3]

      var normals = wall.calculateNormals();

      var normalX = normals[0]
      var normalY = normals[1]


      var bd = tb.getBounceDirection(collisionX, collisionY, normalX, normalY, distance)
      var bdx = bd[0]
      var bdy = bd[1]

      var dif = tb.calculateSpeed() - distance
      var dx = normalize(bdx - collisionX, bdy - collisionY)[0]
      var dy = normalize(bdx - collisionX, bdy - collisionY)[1]

      tb.setPosition(collisionX + (dx * dif), collisionY + (dy * dif))
      tb.setVelocity(bdx - collisionX, bdy - collisionY)
        //console.log(tb.calculateSpeed())
        //console.log(bdx, bdy)

    }
    else {      
          tb.updatePosition();
    }

  }

  balls[balls.length] = tb

  return tb

}



function drawShape(sides, distance, cx, cy, r) {
  r = (r  * (180/Math.PI)) + Math.PI / sides  || Math.PI / sides;
  var oldX = cx + Math.sin(0 + r) * distance
  var oldY = cy + Math.cos(0 + r) * distance
  for (var index = 1; index < sides + 1; index++) {
    var angle = Math.PI * index / sides * 2 + r

    var newX = cx + (Math.sin(angle) * distance)
    var newY = cy + (Math.cos(angle) * distance)

    createWall({
      x1: oldX - normalize(newX - oldX, newY - oldY)[0] * 2,
      y1: oldY - normalize(newX - oldX, newY - oldY)[1] * 2,
      x2: newX + normalize(newX - oldX, newY - oldY)[0] * 2,
      y2: newY + normalize(newX - oldX, newY - oldY)[1] * 2
    })
    oldX = newX
    oldY = newY
  }


}


function createBalls(amount, centerX, centerY) {
  for (var index = 0; index < 5; index++) {
    var data = {};
    var seed = Math.random() * Math.PI * 2 
    data.x  = centerX;
    data.y  = centerY;
    data.vx = Math.sin(seed) * 1;
    data.vy = Math.cos(seed) * 1;

    var ball = createBall(data);
  }
}





var stages = {}
var currentStage = 'squareTest'


stages.squareTest = function(){
  drawShape(4, 180, 200, 200);
}

stages.hexagonTest = function() {
  drawShape(6, 180, 200, 200)
}

stages.circleTest = function() {
  drawShape(24, 180, 200, 200)
}

stages.rotatingOctogon = function() {
  var seed = Date.now() / 360000;
  drawShape(8,180,200,200,seed);
}

stages.madness = function() {
  var seedX = Math.sin(Date.now() / 1000) * 50;
  var seedY = Math.cos(Date.now() / 1000) * 50;
  var seedR = Date.now() / 50000
  drawShape(8,180,200 + seedX,200 + seedY,seedR);
}

function setStage(stage) {
  balls = [];
  currentStage = stage;
  if (stages[stage]) {
    stages[stage]();
    createBalls(5,200,200);
  }
  else {
    console.error(stage+' is not a valid stage name.')
  }
}



function gameStep() {
  clearCanvas()


  walls = [];
  
  stages[currentStage](); // runs current stage
  
  for (var i = walls.length - 1; i >= 0; i--) {
    var wall = walls[i]
    wall.drawWall();

  }

  for (var index = 0; index < balls.length; index++) {
    var ball = balls[index];

    ball.step();
    ball.drawBall();



  }




}



function start(in_canvas) {
  if (in_canvas !== undefined) {
    canvas = in_canvas;
  }
  ctx = canvas.getContext('2d');
  clearCanvas();
}

if (canvas !== undefined) {
  start(canvas);
}

function setColor(color) {
  if (color.indexOf("rgb") < 0) {
    if (color[0] !== "#") {
      console.log("Oops! You need to supply a CSS color like #00CC00 or rgb(200, 1, 50).", "You supplied:", color);
      return;
    }
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
}

function setFillMode(mode) {
  fillMode = mode;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setRandomColor() {
  var red = Math.floor(255 * Math.random());
  var green = Math.floor(255 * Math.random());
  var blue = Math.floor(255 * Math.random());

  setColor("rgba(" + red + ", " + green + ", " + blue + ", 1)")
}

function drawRectangle(x, y, width, height) {
  if (fillMode === "stroke") {
    ctx.strokeRect(x, y, width, height);
  } else {
    ctx.fillRect(x, y, width, height);
  }
}

function drawLine(x1, y1, x2, y2) {

  var oldWidth = ctx.lineWidth;

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.lineWidth = oldWidth;


}


function drawSquare(x, y, width) {
  drawRectangle(x, y, width, width)
}

function drawCircle(x, y, radius) {
  ctx.beginPath();
  var startAngle = 0;
  var endAngle = Math.PI + (Math.PI * 2) / 2;
  ctx.arc(x, y, radius, startAngle, endAngle, false);
  if (fillMode == "fill") {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}