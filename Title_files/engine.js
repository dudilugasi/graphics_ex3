"use strict";

/**
 * globals
 */

var ctx;
var canvasWidth = 500;
var canvasHeight = 500;

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
    var distance = options.distance;
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
    return {x: newVertex[0], y: newVertex[1], z: newVertex};

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
    return {x: newVertex[0], y: newVertex[1], z: newVertex};

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

    for (i = 0; i < polygons.length; i++) {
        var polygon = [];
        for (j = 0; j < polygons[i].e.length; j++) {
            polygon.push(points[polygons[i].e[j]]);
        }

        //var normal = findNormal(Vertices[polygons[i].e[0]],Vertices[polygons[i].e[1]],Vertices[polygons[i].e[2]]);

        //var vecFromCam = {x: 0 - Vertices[polygons[i].e[0]].x, y: 0 - Vertices[polygons[i].e[0]].y, z: 0 - Vertices[polygons[i].e[0]].y};

        var normal = findNormal(polygon[0], polygon[1], polygon[2]);


        var CameraPosition = {
            x:250,
            y:250,
            z:1
        };

        var planeToCamx = CameraPosition.x - Vertices[polygons[i].e[0]].x;
        var planeToCamy = CameraPosition.y - Vertices[polygons[i].e[0]].y;
        var planeToCamz = CameraPosition.z - Vertices[polygons[i].e[0]].z;

        if (planeToCamx * normal.x + planeToCamy * normal.y + planeToCamz * normal.z > 0)
        {
            drawPolygon(polygon);
        }

    }
}

/**
 * calculating cross product of two vetros
 */
function crossProduct(A, B) {

    return {
        x: A.y * B.z - A.z * B.y,
        y: A.z * B.x - A.x * B.z,
        z: A.x * B.y - A.y * B.x
    };
}

/**
 * normalize vector
 */

function normalizeVec(vec) {
    var l = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    vec = {x: vec.x / l, y: vec.y / l, z: vec.z / l};
    return vec;

}

function findNormal(v1, v2, v3) {
    // Find the first vector and second vector
    var vec1 = {x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z};
    var vec2 = {x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z};

    //normalize the vectors
    vec1 = normalizeVec(vec1);
    vec2 = normalizeVec(vec2);

    // Return the computed cross product
    return crossProduct(vec1, vec2);
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
 * gui options
 *
 */
var Options = function () {

    this.projection = 'perspective';

    this.draw = draw;

    this.scaleValue = 1;

    this.scale = GUIScale;

    this.distance = -1000;

    this.rotateValue = 45;

    this.rotateY = rotateCenterY;

    this.rotateX = rotateCenterX;

    this.rotateZ = rotateCenterZ;

    this.obliqueAngle = 45;

};

var options = new Options();

jQuery(document).ready(function ($) {

    var gui = new dat.GUI();
    gui.add(options, 'projection', ['parallel', 'cavalier', 'cabinet', 'perspective']);
    gui.add(options, 'distance');
    gui.add(options, 'obliqueAngle');
    gui.add(options, 'scaleValue', 0, 5);
    gui.add(options, 'scale');
    gui.add(options, 'rotateValue').step(1).min(-360).max(360);
    gui.add(options, 'rotateX');
    gui.add(options, 'rotateY');
    gui.add(options, 'rotateZ');
    gui.add(options, 'draw');
    var i;
    var canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f0';
    ctx.fillStyle = '#000';
    console.log(polygons);
    draw("perspective");


});
