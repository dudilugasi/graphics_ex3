"use strict";

/**
 * globals
 */

var ctx;
var canvasWidth = 500;
var canvasHeight = 500;
var fov = 0.785398;
var distance = -1000;
function drawPolygon(points) {

    ctx.beginPath();
    ctx.moveTo(Math.round(points[0].x), Math.round(points[0].y));
    for (var i = 0; i < points.length; i++) {
        var next = (i + 1) == points.length ? 0 : i + 1;
        ctx.lineTo(Math.round(points[next].x), Math.round(points[next].y));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

/**
 *   perspective projection of point
 */
function perspective(x, y, z) {

    var newVertex = numeric.dot([x, y, z, 1], [
        [1 / (1 + z / distance), 0, 0, 0],
        [0, 1 / (1 + z / distance), 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 1]]);

    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

/**
 * cavalier projection of point
 *
 */
function cavalier(x, y, z) {

    var t = toRadians(options.obliqueAngle);
    var cavalier = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [Math.cos(t), Math.sin(t), 0, 0],
        [0, 0, 0, 1]];

    var newVertex = numeric.dot([x, y, z, 1], cavalier);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

/**
 * cavalier projection of point
 *
 */
function cabinet(x, y, z) {

    var t = toRadians(options.obliqueAngle);
    var cabinet = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [Math.cos(t) / 2, Math.sin(t) / 2, 0, 0],
        [0, 0, 0, 1]];

    var newVertex = numeric.dot([x, y, z, 1], cabinet);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}


/**
 * get point and translate it by xt,yt,zt
 */
function translate(x, y, z, xt, yt, zt) {
    var translate = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [xt, yt, zt, 1]];

    var newVertex = numeric.dot([x, y, z, 1], translate);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

/**
 * get point and scale it by xt,yt,zt
 */
function scale(x, y, z, xt, yt, zt) {
    var scale = [
        [xt, 0, 0, 0],
        [0, yt, 0, 0],
        [0, 0, zt, 0],
        [0, 0, 0, 1]];

    var newVertex = numeric.dot([x, y, z, 1], scale);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

function rotateX(x, y, z, t) {
    var rotate = [
        [1, 0, 0, 0],
        [0, Math.cos(t), Math.sin(t), 0],
        [0, -Math.sin(t), Math.cos(t), 0],
        [0, 0, 0, 1]];

    var newVertex = numeric.dot([x, y, z, 1], rotate);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

function rotateY(x, y, z, t) {
    var rotate = [
        [Math.cos(t), 0, Math.sin(t), 0],
        [0, 1, 0, 0],
        [-Math.sin(t), 0, Math.cos(t), 0],
        [0, 0, 0, 1]];

    var newVertex = numeric.dot([x, y, z, 1], rotate);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

function rotateZ(x, y, z, t) {
    var rotate = [
        [Math.cos(t), Math.sin(t), 0, 0],
        [-Math.sin(t), Math.cos(t), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    var newVertex = numeric.dot([x, y, z, 1], rotate);
    return {x: newVertex[0], y: newVertex[1], z: newVertex[2]};

}

function draw() {

    var projection = options.projection;
    var i, j;
    var points = [];
    var depthArr = [];

    if (projection === null) {
        projection = 0;
    }

    //get projected values of the points according to gui
    for (i = 0; i < Vertices.length; i++) {
        switch (projection) {
            case "parallel":
                points[i] = {x: Vertices[i].x, y: Vertices[i].y, z: 0};
                break;
            case "cavalier":
                points[i] = cavalier(Vertices[i].x, Vertices[i].y, Vertices[i].z);
                break;
            case "cabinet":
                points[i] = cabinet(Vertices[i].x, Vertices[i].y, Vertices[i].z);
                break;
            case "perspective":
                points[i] = perspective(Vertices[i].x, Vertices[i].y, Vertices[i].z);
                break;
        }

        //get the depth of the point
        depthArr[i] = Vertices[i].z;

    }

    //calculate average depth for each polygon
    for (i = 0; i < polygons.length; i++) {
        // Sum and average
        var averagePolygonDepth = depthArr[polygons[i].e[0]];
        averagePolygonDepth += depthArr[polygons[i].e[1]];
        averagePolygonDepth += depthArr[polygons[i].e[2]];
        averagePolygonDepth /= 3;

        polygons[i].depth = averagePolygonDepth;
    }

    //sort polygons by depth
    polygons.sort(function (a, b) {
        return a.depth - b.depth;
    });

    clearCanvas();

    //draws polygons
    for (i = 0; i < polygons.length; i++) {
        var polygon = [];
        for (j = 0; j < polygons[i].e.length; j++) {
            polygon.push(points[polygons[i].e[j]]);
        }

        ctx.fillStyle = polygons[i].c;

        drawPolygon(polygon);

    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}


function translateCanvas(x, y, z) {

    for (var i = 0; i < Vertices.length; i++) {
        Vertices[i] = translate(Vertices[i].x, Vertices[i].y, Vertices[i].z, x, y, z);
    }

}

function rotateCanvasX(t) {
    for (var i = 0; i < Vertices.length; i++) {
        Vertices[i] = rotateX(Vertices[i].x, Vertices[i].y, Vertices[i].z, t);
    }
}

function rotateCanvasY(t) {
    for (var i = 0; i < Vertices.length; i++) {
        Vertices[i] = rotateY(Vertices[i].x, Vertices[i].y, Vertices[i].z, t);
    }
}

function rotateCanvasZ(t) {
    for (var i = 0; i < Vertices.length; i++) {
        Vertices[i] = rotateZ(Vertices[i].x, Vertices[i].y, Vertices[i].z, t);
    }
}


/**
 * scale the vertices by the value from the GUI
 * @constructor
 */
function GUIScale() {

    var value = options.scaleValue;

    for (var i = 0; i < Vertices.length; i++) {
        Vertices[i] = scale(Vertices[i].x, Vertices[i].y, Vertices[i].z, value, value, value);
    }

    draw();
}

/**
 * rotates the shape around the Y axis of the center
 *
 */
function rotateCenterX() {


    translateCanvas(0, -canvasHeight / 2, 0);
    rotateCanvasY(Math.PI / 2);
    rotateCanvasZ(toRadians(options.rotateValue));
    rotateCanvasY(-Math.PI / 2);
    translateCanvas(0, canvasHeight / 2, 0);

    draw();
}


/**
 * rotates the shape around the Y axis of the center
 *
 */
function rotateCenterY() {

    translateCanvas(-canvasWidth / 2, 0, 0);
    rotateCanvasX(Math.PI / 2);
    rotateCanvasY(Math.PI);
    rotateCanvasZ(toRadians(options.rotateValue));
    rotateCanvasY(-Math.PI);
    rotateCanvasX(-Math.PI / 2);
    translateCanvas(canvasWidth / 2, 0, 0);

    draw();
}

/**
 * rotates the shape around the Y axis of the center
 *
 */
function rotateCenterZ() {

    translateCanvas(-canvasWidth / 2, -canvasWidth / 2, 0);
    rotateCanvasZ(toRadians(options.rotateValue));
    translateCanvas(canvasWidth / 2, canvasWidth / 2, 0);

    draw();
}

/**
 * from degrees to radians
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * get values from gui  and translate the shapes
 */
function translateGUI() {
    var x = options.translateValX;
    var y = options.translateValY;
    var z = options.translateValZ;
    translateCanvas(x, y, z);

    draw();
}


/**
 * animation handle
 * @type {null}
 */
var animeInterval = null;
var song;

function animate() {
    if (!animeInterval) {
        options.rotateValue = 0.5;
        animeInterval = setInterval(loop, 50);
        song.play();
    }
    else {
        clearInterval(animeInterval);
        animeInterval = null;
        song.pause();
    }
}

function loop() {
    options.rotateX();
    options.rotateY();
    options.rotateZ();
}



/**
 * gui options
 *
 */
var Options = function () {

    this.projection = 'perspective';

    this.draw = draw;

    this.scaleValue = 1;

    this.scale = GUIScale;

    this.rotateValue = 15;

    this.rotateY = rotateCenterY;

    this.rotateX = rotateCenterX;

    this.rotateZ = rotateCenterZ;

    this.obliqueAngle = 45;

    this.animate = animate;

    this.translate = translateGUI;

    this.translateValX = 0;

    this.translateValY = 0;

    this.translateValZ = 0;


};

var options = new Options();

jQuery(document).ready(function ($) {

    /**
     * intialize song
     * @type {Element}
     */
    song = document.getElementById("song");
    song.volume = 0.5;


    /**
     * initiallize gui
     */
    var gui = new dat.GUI();

    var fProjection = gui.addFolder('projection');
    fProjection.add(options, 'projection', ['parallel', 'cavalier', 'cabinet', 'perspective']);
    fProjection.add(options, 'obliqueAngle');
    fProjection.add(options, 'draw');

    var fScale = gui.addFolder('scaling');
    fScale.add(options, 'scaleValue', 0, 5);
    fScale.add(options, 'scale');

    var fRotate = gui.addFolder('rotation');
    fRotate.add(options, 'rotateValue').step(1).min(-360).max(360);
    fRotate.add(options, 'rotateX');
    fRotate.add(options, 'rotateY');
    fRotate.add(options, 'rotateZ');

    var fTranslate = gui.addFolder('translation');
    fTranslate.add(options, 'translateValX');
    fTranslate.add(options, 'translateValY');
    fTranslate.add(options, 'translateValZ');
    fTranslate.add(options, 'translate');

    gui.add(options, 'animate');


    /**
     * initialize canvas
     * @type {Element}
     */
    var canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    draw("perspective");

    /**
     * initialize help
     */
    $('.fa-question-circle').click(function () {
        $("#help").removeClass().removeClass('hidden').addClass("fadeInDown animated");
    });

    $('.fa-times').click(function () {
        $("#help").removeClass().addClass("fadeOutDown animated").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            var $help = $("#help");
            if ($help.hasClass("fadeInDown")) {
                return;
            }
            $help.addClass('hidden');
        });
    });

});
