/**
 * Differs from the original in that as you move the mouse over the grid
 * the square below turns white, whilst re-evaluating its chance of being green or blue,
 * so sometimes it changes colour.
 * Also quite a nice "trail" effect from the mouse movement
 */

var size = 20;

// Introduces a kind of offset/padding that takes into account the fact that a stroke is drawn both above & below
// the "line" that defines a shape.
// Original divisor was 10: which combines with how the offset and size are drawn below, in createSquare.
// Note there how the values add up to 10.
// We then adjusted the value to 9 to "shunt" everything together a bit so the padding/ofsets "collapse"
// so we don't get double padding beteween squares
var unit = size / 9;
var startX = 0;
var startY = 0;
var columns = 44;
var rows = 31;
var canvasW = size * columns;
var canvasH = size * rows;
var backgroundColor = 'rgb(0, 103, 189)';
var blueColor = 'rgb(0, 74, 183)';
var greenColor = 'rgb(12, 167, 17)';
var whiteColor = 'rgba(255, 255, 255, 0.3)';

var useUnitWhenDrawingSquare = true;

let myCanvas = null;

function setup() {
	myCanvas = createCanvas(canvasW + 4, canvasH);

	background(backgroundColor);

	strokeWeight(unit);

	stroke(greenColor);

	noFill();

	for (let i = 0; i < columns; i++) {
		for (let j = 0; j < rows; j++) {
			const x = startX + size * i;
			const y = startY + size * j;

			createSquare(x, y);
		}
	}

	myCanvas.canvas.addEventListener('mousemove', (e) => {
		if (mouseX > 0 && mouseY > 0) {
			const coords = getGridCell(mouseX, mouseY);

			if (coords) {
				console.log('coords=', coords);

				// Turn square under mouse white
				createSquare(coords.cellX, coords.cellY, true);

				const replacedSqX = coords.cellX;
				const replacedSqY = coords.cellY;

				// Reset square to blue/green based on chance
				setTimeout(() => {
					createSquare(replacedSqX, replacedSqY);
				}, 300);
			}
		}
	});
}

// function draw() {
// 	if (mouseX > 0 && mouseY > 0) {
// 		const coords = getGridCell(mouseX, mouseY);

// 		if (coords) {
// 			console.log('coords=', coords);

// 			// Turn square under mouse white
// 			createSquare(coords.cellX, coords.cellY, true);

// 			const replacedSqX = coords.cellX;
// 			const replacedSqY = coords.cellY;

// 			// Reset square to blue/green based on chance
// 			setTimeout(() => {
// 				createSquare(replacedSqX, replacedSqY);
// 			}, 300);
// 		}
// 	}
// }

function createSquare(x, y, isWhite = false) {
	var chance = (x / width) * 100;

	// outer sq
	if (isWhite) {
		stroke(whiteColor);
	} else {
		var isOuterBlue = random(0, 100) < chance; // more chance of green on left, & blue on right
		if (isOuterBlue) {
			stroke(blueColor);
		} else {
			stroke(greenColor);
		}
	}

	if (useUnitWhenDrawingSquare) {
		square(x + unit * 1.5, y + unit * 1.5, unit * 7); // see comment at top: 1.5 + 1.5 + 7 = 10
	} else {
		square(x, y, size); // also gives a nice effect (of partial outlines, as squares overlap)
	}

	// inner sq
	if (isWhite) {
		stroke(whiteColor);
	} else {
		var isInnerBlue = random(0, 100) < chance;
		if (isInnerBlue) {
			stroke(blueColor);
		} else {
			stroke(greenColor);
		}
	}

	if (useUnitWhenDrawingSquare) {
		square(x + unit * 3.5, y + unit * 3.5, unit * 3); // see comment at top: 3.5 + 3.5 + 3 = 10
	} else {
		square(x + 10, y + 10, size - 20);
	}
}

function getGridCell(_mouseX, _mouseY) {
	const col = floor(_mouseX / size);
	const row = floor(_mouseY / size);

	const cellX = col * size;
	const cellY = row * size;

	if (col <= columns && row <= rows) {
		return { col, row, cellX, cellY };
	}
	return null;
}
