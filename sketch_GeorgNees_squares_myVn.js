// ref: https://openprocessing.org/sketch/2798401#page-1

var size = 30;

// Introduces a kind of offset/padding that takes into account the fact that a stroke is drawn both above & below
// the "line" that defines a shape.
// Original divisor was 10: which combines with how the offset and size are drawn below, in createSquare.
// Note there how the values add up to 10.
// We then adjusted the value to 9 to "shunt" everything together a bit so the padding/ofsets "collapse"
// so we don't get double padding beteween squares
var unit = size / 9;
var cellX = 0; // tracks the number of cells drawn = columns
var cellY = 0;
var columns = 44;
var rows = 31;
var canvasW = size * columns;
var canvasH = size * rows;
var backgroundColor = 'rgb(0, 103, 189)';
var blueColor = 'rgb(0, 74, 183)';
var greenColor = 'rgb(12, 167, 17)';

var useUnitWhenDrawingSquare = true;

function setup() {
	createCanvas(canvasW + 4, canvasH);
	background(backgroundColor);

	strokeWeight(unit);

	stroke(greenColor);

	// cmd + shift + c for colour picker
	// fill('rgb(0, 0, 200)');
	noFill();

	// NOTE: once we've created a canvas - the "width" & "height" vars exists
	// while (cellX < width && cellY < height) {
	// 	createSquare(cellX, cellY);
	// 	cellX = cellX + size;

	// 	if (cellX >= width) {
	// 		cellX = 0;
	// 		cellY = cellY + size;
	// 	}
	// }

	for (let i = 0; i < columns; i++) {
		for (let j = 0; j < rows; j++) {
			const x = cellX + size * i;
			const y = cellY + size * j;

			createSquare(x, y);
		}
	}
}

// function draw() {
// 	background(100, 16);
// 	circle(mouseX, mouseY, random(5, 20));
// }

function createSquare(x, y) {
	var chance = (x / width) * 100;

	// outer sq
	// var isOuterBlue = random(0, 100) < 50;// 50/50 chance. But gives nice effect
	var isOuterBlue = random(0, 100) < chance; // more chance of green on left, & blue on right
	if (isOuterBlue) {
		stroke(blueColor);
	} else {
		stroke(greenColor);
	}

	if (useUnitWhenDrawingSquare) {
		square(x + unit * 1.5, y + unit * 1.5, unit * 7); // see comment at top: 1.5 + 1.5 + 7 = 10
	} else {
		square(x, y, size); // also gives a nice effect (of partial outlines, as squares overlap)
	}

	// inner sq
	// var isInnerBlue = random(0, 100) < 50; // 50/50 chance
	var isInnerBlue = random(0, 100) < chance;
	if (isInnerBlue) {
		stroke(blueColor);
	} else {
		stroke(greenColor);
	}

	if (useUnitWhenDrawingSquare) {
		square(x + unit * 3.5, y + unit * 3.5, unit * 3); // see comment at top: 3.5 + 3.5 + 3 = 10
	} else {
		square(x + 10, y + 10, size - 20);
	}
}
