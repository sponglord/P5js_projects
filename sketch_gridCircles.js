const _backgroundColor = 'rgb(0, 103, 189)';
const _blueColor = 'rgb(0, 74, 183)';
const _greenColor = 'rgb(12, 167, 17)';
const _whiteColor = 'rgba(255, 255, 255, 0.7)';

const _inAGeorgNeesStylee = true;

const _canvasW = 1000;
const _canvasH = 600;

const _sqSize = 20;
const _unit = _sqSize / 9;

const _centerX = _canvasW / 2;
const _centerY = _canvasH / 2;

let _maxDistFromCenter = null;

const _maxGridSize = 15; // 15

const _gridSizes = [];
const _gridStartPositions = [];
const _gridSquaresCount = [];
const _cells = [];
const _cellsByGridSize = [];

let _checkForCollision = false;
let _gotoTarget = true;

// We multiply the particle's velocity by this value so we have an overall control of the speed
const _speed = 1; // base value = 1

function setup() {
	createCanvas(_canvasW, _canvasH);
	background(_backgroundColor);

	strokeWeight(2);

	noFill();

	// noLoop(); // only run draw code once

	rectMode(CENTER); // draw square from centre

	// createGridOutline(3, 3, 10, 10, _sqSize);

	// Generate set of odd numbers - these will be the sizes of our grids e.g. 3x3, 5x5 etc
	for (let i = 3; i <= _maxGridSize + 1; i += 2) {
		// 3, 5, 7, 9...
		_gridSizes.push(i);
		// Create a set of empty arrays stored at an index based on their grid size
		_cellsByGridSize[i] = [];
	}

	// Use the grid sizes to calculate the start position of each of our grid outlines, moving out from the centre
	for (let i = 0; i < _gridSizes.length; i++) {
		const gridSize = _gridSizes[i];

		// Create set of start coords starting at centre and moving 1.5 square up and to the left on each tick
		let gridStartX = _centerX - _sqSize * (gridSize / 2);
		let gridStartY = _centerY - _sqSize * (gridSize / 2);

		// When rectMode = CENTER we have to adjust positions by half a square
		// (keeps grid drawn centrally on canvas)
		gridStartX += _sqSize / 2;
		gridStartY += _sqSize / 2;

		// console.log('### gridStartX:: =', gridStartX);
		// console.log('### gridStartY:: =', gridStartY);

		_gridStartPositions.push([gridStartX, gridStartY]);
	}

	// Calc top left square's dist from centre point
	const lastGridCell = _gridStartPositions[_gridStartPositions.length - 1];
	const dx = lastGridCell[0] - _centerX;
	const dy = lastGridCell[1] - _centerY;
	_maxDistFromCenter = Math.sqrt(dx * dx + dy * dy) + _sqSize / 4; // add _sqSize / 4 to allow *some* chance of green on the outer squares

	// Loop thru the grid sizes & start positions to create a series of grid outlines
	for (let i = 0; i < _gridSizes.length; i++) {
		const gridSize = _gridSizes[i];

		const [gridStartX, gridStartY] = _gridStartPositions[i];

		// Create grid outline
		const numSquaresCreated = createGridOutline(
			gridSize,
			gridSize,
			gridStartX,
			gridStartY
		);
		_gridSquaresCount.push(numSquaresCreated);
	}

	console.log('### :: _gridSizes=', _gridSizes);
	console.log('### :: _cellsByGridSize=', _cellsByGridSize);
	console.log('### :: gridStartPositions=', _gridStartPositions);
	console.log('### :: _gridSquaresCount=', _gridSquaresCount);

	setTimeout(() => {
		for (let i = 0; i < _gridSizes.length; i++) {
			let gridSize = _gridSizes[i];
			const cellsArr = _cellsByGridSize[gridSize];
			arrangeSquaresInCircle(
				cellsArr,
				_sqSize,
				_centerX,
				_centerY,
				// gridSize * 10
				gridSize * _sqSize * 0.55
			);
		}
	}, 3000);

	// Now we know the number of squares in each grid, we can calculate their radial distances if we want to arrange them in a circle
	generateCellRadialDistances(_cells, _gridSizes, _gridSquaresCount);
}

// function draw() {
// 	background(_backgroundColor);

// 	updatePositions();

// 	for (let i = 0; i < _cells.length; i++) {
// 		const cell = _cells[i];
// 		drawCell(cell, _sqSize, _unit);
// 	}

// 	// Get the size of the outer grid e.g. 15x15
// 	const gridSize = _gridSizes[_gridSizes.length - 1];
// 	const coords = getGridCell(
// 		mouseX,
// 		mouseY,
// 		gridSize,
// 		gridSize,
// 		_sqSize,
// 		_gridStartPositions
// 	);

// 	if (coords) {
// 		stroke(_whiteColor);
// 		square(coords.cellX, coords.cellY, _sqSize);
// 	}
// }

function mousePressed() {
	console.log('### mouseX:: =', mouseX);
	console.log('### mouseY:: =', mouseY);

	// 	// Get the size of the outer grid e.g. 15x15
	// 	const gridSize = _gridSizes[_gridSizes.length - 1];
	// 	const coords = getGridCell(
	// 		mouseX,
	// 		mouseY,
	// 		gridSize, // i.e. columns
	// 		gridSize, // i.e. rows
	// 		_sqSize,
	// 		_gridStartPositions
	// 	);
	// 	console.log('### coords:: =', coords);

	// 	// if we're clicking within grid
	// 	if (coords) {
	// 		_checkForCollision = true;
	// 	}
}

// function mouseReleased() {
// 	_checkForCollision = false;

// 	for (let i = 0; i < _cells.length; i++) {
// 		const cell = _cells[i];
// 		cell.inCollision = false;
// 	}
// }

// const updatePositions = function () {
// 	if (_checkForCollision) {
// 		checkForCollision(_cells);
// 	}

// 	for (let i = 0; i < _cells.length; i++) {
// 		const cell = _cells[i];

// 		move(cell, i);
// 	}
// };

// This function could make sense outside this sketch & therefore should have
// all the required values passed as arguments
//
// This version of collision detection is O(n²) because it checks every cell against every other cell.
// const checkForCollision = function (pCellsArr) {
// 	const spring = 0.05;

// 	const numCells = pCellsArr.length;

// 	for (let i = 0; i < numCells - 1; i++) {
// 		const cell0 = pCellsArr[i];

// 		let {
// 			x: x0,
// 			y: y0,
// 			radius: radius0,
// 			vx: vx0,
// 			vy: vy0,
// 			inCollision: inCollision0,
// 		} = cell0;

// 		cell0.inCollision = false;

// 		for (let j = i + 1; j < numCells; j++) {
// 			const cell1 = pCellsArr[j];

// 			let {
// 				x: x1,
// 				y: y1,
// 				radius: radius1,
// 				vx: vx1,
// 				vy: vy1,
// 				inCollision: inCollision1,
// 			} = cell1;

// 			cell1.inCollision = false;

// 			const dx = x1 - x0;
// 			const dy = y1 - y0;
// 			const dist = Math.sqrt(dx * dx + dy * dy);
// 			const minDist = radius0 + radius1;

// 			if (dist <= minDist) {
// 				// const angle = Math.atan2(dy, dx);
// 				const tx = x0 + (dx / dist) * minDist;
// 				const ty = y0 + (dy / dist) * minDist;
// 				const ax = (tx - cell1.x) * spring;
// 				const ay = (ty - cell1.y) * spring;
// 				vx0 -= ax * _speed;
// 				vy0 -= ay * _speed;
// 				vx1 += ax * _speed;
// 				vy1 += ay * _speed;
// 				//
// 				inCollision0 = true;
// 				inCollision1 = true;
// 				// write properties back
// 				cell0.vx = vx0;
// 				cell0.vy = vy0;
// 				cell0.inCollision = inCollision0;
// 				cell1.vx = vx1;
// 				cell1.vy = vy1;
// 				cell1.inCollision = inCollision1;
// 			} else {
// 				cell1.inCollision = false;
// 			}
// 		}
// 	}
// };

// const move = function (cell, index) {
// 	const easing = 0.08;
// 	const bounce = -1;

// 	if (_gotoTarget) {
// 		// If image is not undergoing collision calculations - set it on it's way to it's target position
// 		if (!cell.inCollision) {
// 			const dx = cell.targetX - cell.x;
// 			const dy = cell.targetY - cell.y;

// 			cell.vx = dx * easing;
// 			cell.vy = dy * easing;
// 		}
// 	}

// 	// Change the img's position by its new velocity
// 	cell.x += cell.vx * _speed;
// 	cell.y += cell.vy * _speed;
// };

// TODO - this function only makes sense within this sketch - so can use globals
// Create a grid "outline" i.e. only draw the squares that represent the outer edge of the grid
function createGridOutline(pColumns, pRows, pStartX, pStartY) {
	let sqCount = 0;
	for (let i = 0; i < pColumns; i++) {
		for (let j = 0; j < pRows; j++) {
			// Only draw outer colums and rows
			if (i === 0 || i === pColumns - 1 || j === 0 || j === pRows - 1) {
				const x = pStartX + _sqSize * i;
				const y = pStartY + _sqSize * j;

				// Calculate the distance of the starting square from the centre point
				const dx = pStartX - _centerX;
				const dy = pStartY - _centerY;
				const dist = Math.sqrt(dx * dx + dy * dy);

				let cell = createCell(
					x,
					y,

					pColumns, // use columns as an indicator of grid size (we're presuming a square grid)
					dist
				);
				// Store the cell in a master array
				_cells.push(cell);

				// Also keep a reference to the cell: placing it in an array that's at an index that matches the cell's grid size
				_cellsByGridSize[cell.gridSize].push(cell);

				// Count how many squares we're creating in each "outline"
				sqCount++;
			}
		}
	}
	return sqCount;
}

// This function only makes sense within this sketch - so can use globals
const createCell = function (pX, pY, pColumns, pDist) {
	const collisionPadding = 0;
	const imageW = _sqSize + collisionPadding; // make border we use to detect collision slightly larger that actual square
	const imageH = _sqSize + collisionPadding;

	// Now we know the maximum distance a square can be from the centre
	// - generate a stroke colour based on that distance
	let outerStrokeColor;
	let innerStrokeColor;

	const chance = (pDist / _maxDistFromCenter) * 100;

	var isOuterBlue = random(0, 100) < chance;
	if (isOuterBlue) {
		outerStrokeColor = _blueColor;
	} else {
		outerStrokeColor = _greenColor;
	}

	var isInnerBlue = random(0, 100) < chance;
	if (isInnerBlue) {
		innerStrokeColor = _blueColor;
	} else {
		innerStrokeColor = _greenColor;
	}
	// --

	const cellObj = {
		width: imageW,
		height: imageH,
		radius: Math.sqrt(imageW * imageW + imageH * imageH) / 2,
		// x: pX,
		// y: pY,
		x: Math.random() * (_canvasW - imageW), // - imageW keeps the initial position within the canvas
		y: Math.random() * (_canvasH - imageH),
		vx: Math.random() * 6 - 3,
		vy: Math.random() * 6 - 3,
		gridTargetX: pX,
		gridTargetY: pY,
		radialTargetX: null,
		radialTargetY: null,
		theta: null,
		circleRadius: null,
		targetX: pX,
		targetY: pY,
		inCollision: false,
		gridSize: pColumns, // use columns as an indicator of grid size (we're presuming a square grid)
		distFromCenter: pDist,
		outerStrokeColor,
		innerStrokeColor,
	};

	return cellObj;
};

// Already uses p5 globals like stroke & square, so can use other globals
function drawCell(pCell) {
	if (_inAGeorgNeesStylee) {
		stroke(pCell.outerStrokeColor);
		square(pCell.x, pCell.y, _unit * 7);

		stroke(pCell.innerStrokeColor);
		square(pCell.x, pCell.y, _unit * 3);
	} else {
		stroke(_greenColor);
		square(pCell.x, pCell.y, _sqSize);
	}
}

// Already uses p5 globals like stroke & square, so can use other globals
function drawRotatedCell(pCell) {
	push(); // save the current transform
	translate(pCell.radialTargetX, pCell.radialTargetY); // move to cell centre

	rotate(pCell.theta); // rotate around that point

	if (_inAGeorgNeesStylee) {
		stroke(pCell.outerStrokeColor);
		square(0, 0, _unit * 7); // since we've transformed to the square's centre, we can draw the square from there

		stroke(pCell.innerStrokeColor);
		square(0, 0, _unit * 3);
	} else {
		stroke(_greenColor);
		square(0, 0, _sqSize);
	}

	pop();
}

// This function could make sense outside this sketch & therefore should have
// all the required values passed as arguments
function getGridCell(
	pMouseX,
	pMouseY,
	pColumns,
	pRows,
	pSqSize,
	pGridStartPositions
) {
	const firstCell = pGridStartPositions[pGridStartPositions.length - 1]; // i.e. cell at 0,0 postition (top left)

	const startX = firstCell[0];
	const startY = firstCell[1];

	// const col = floor(pMouseX / pSqSize); // is the regular way
	// But, we need to take into account where we've started drawing the squares from (startX, startY)
	// and the fact that we're drawing the squares from the centre, not the top left (pSize / 2)
	const adjustedMouseX = pMouseX - startX + pSqSize / 2;
	const adjustedMouseY = pMouseY - startY + pSqSize / 2;

	const col = floor(adjustedMouseX / pSqSize);
	const row = floor(adjustedMouseY / pSqSize);

	const cellX = startX + col * pSqSize;
	const cellY = startY + row * pSqSize;

	// Only return coords if we're within the grid
	if (col >= 0 && col < pColumns && row >= 0 && row < pRows) {
		return { col, row, cellX, cellY };
	}
	return null;
}

// TODO - this function only makes sense within this sketch - so can use globals
function generateCellRadialDistances(pCells, pGridSizes, pGridSquaresCount) {
	// Loop through gridSizes array
	// Use each value as an index to reference the cells stored in _cellsByGridSize
	// The number in each cells array would be the value for numSquares
	// Work out a set of suitable circle radii

	for (let i = 0; i < pGridSizes.length; i++) {
		let gridSize = pGridSizes[i];
		const cellsArr = _cellsByGridSize[gridSize];

		// let circleRadius = 11 * gridSize;
		// let circleRadius = _unit * 5 * gridSize; // _unit * 5 (arbitrary, equals ±11)
		let circleRadius = gridSize * _sqSize * 0.55;

		let numSquares = cellsArr.length;

		for (var k = 0; k < numSquares; k++) {
			let theta = (k * TWO_PI) / numSquares; // radial angle of the square
			theta -= HALF_PI; // to start drawing from the 12 o'clock position instead of the 3 o'clock

			const radialTargetX = _centerX + circleRadius * cos(theta);
			const radialTargetY = _centerY + circleRadius * sin(theta);

			let cell = cellsArr[k];
			cell.radialTargetX = radialTargetX;
			cell.radialTargetY = radialTargetY;
			cell.theta = theta;
			cell.circleRadius = circleRadius;

			setTimeout(() => {
				drawRotatedCell(cell);
			}, 50 * (k + 1));
		}
	}
}

const arrangeSquaresInCircle = function (
	pCellsArr,
	pSqSize,
	pStartX,
	pStartY,
	pCircleRadius
) {
	let numSquares = pCellsArr.length;

	for (let i = 0; i < numSquares; i++) {
		let theta = (i * TWO_PI) / numSquares; // radial angle of the square
		theta -= HALF_PI; // to start drawing from the 12 o'clock position instead of the 3 o'clock

		const targetX = pStartX + pCircleRadius * cos(theta);
		const targetY = pStartY + pCircleRadius * sin(theta);

		setTimeout(() => {
			push(); // save the current transform
			translate(targetX, targetY); // move to cell centre

			rotate(theta); // rotate around that point
			strokeWeight(1);
			square(0, 0, pSqSize); // since we've transformed to the squares centre, we can draw the square from there

			pop(); // restore the original transform
		}, 50 * (i + 1));
	}
};
