/**
 * Original version from https://openprocessing.org/sketch/2798401#page-1
 */

var size = 20;
var unit = size / 18;
var columns = 44;
var rows = 31;
var cellX = 0;
var cellY = 0;
var backgroundColor = 'rgb(0, 103, 189)';
var blueColor = 'rgb(0, 74, 183)';
var greenColor = 'rgb(12, 167, 17)';

function setup() {
	createCanvas(size * columns, size * rows);
	background(backgroundColor);

	stroke(greenColor);
	strokeWeight(unit * 2);
	noFill();

	// While cell has not reached the canvas width and height
	while (cellX < width && cellY < height) {
		drawCell();

		// Increase position for the next loop.
		cellX = cellX + size;

		//if it is the end of the row, reset cell position to the start of the next row
		if (cellX == width) {
			cellX = 0;
			cellY = cellY + size;
		}
	}
}

function drawCell() {
	// decide on color
	var chance = cellX / width;
	var isOuterBlue = random() < chance;
	if (isOuterBlue) {
		stroke(blueColor);
	} else {
		stroke(greenColor);
	}

	// inner square
	square(cellX + unit * 3, cellY + unit * 3, unit * 14);

	var isInnerBlue = random() < chance;
	if (isInnerBlue) {
		stroke(blueColor);
	} else {
		stroke(greenColor);
	}

	// outer square
	square(cellX + unit * 7, cellY + unit * 7, unit * 6);
}
