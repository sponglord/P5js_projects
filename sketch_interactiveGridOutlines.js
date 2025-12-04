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

const _maxGridSize = 15;

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
	for (let i = 1; i <= _maxGridSize + 1; i += 2) {
		// 1, 3, 5, 7, 9...
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
			gridStartY,
			_sqSize,
			_maxDistFromCenter,
			_cells
		);
		_gridSquaresCount.push(numSquaresCreated);
	}

	console.log('### :: _gridSizes=', _gridSizes);
	console.log('### :: _cellsByGridSize=', _cellsByGridSize);
	console.log('### :: gridStartPositions=', _gridStartPositions);
	console.log('### :: _gridSquaresCount=', _gridSquaresCount);

	// Now we know the number of squares in each grid, we can calculate their radial distances if we want to arrange them in a circle
	// generateCellRadialDistances(_cells, _gridSizes, _gridSquaresCount);
}

function draw() {
	background(_backgroundColor);

	updatePositions();

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		drawCell(cell, _sqSize, _unit);
	}

	// Get the size of the outer grid e.g. 15x15
	const gridSize = _gridSizes[_gridSizes.length - 1];
	const coords = getGridCell(
		mouseX,
		mouseY,
		gridSize,
		gridSize,
		_sqSize,
		_gridStartPositions
	);

	if (coords) {
		stroke(_whiteColor);
		square(coords.cellX, coords.cellY, _sqSize);
	}
}

function mousePressed() {
	console.log('### mouseX:: =', mouseX);
	console.log('### mouseY:: =', mouseY);

	// Get the size of the outer grid e.g. 15x15
	const gridSize = _gridSizes[_gridSizes.length - 1];
	const coords = getGridCell(
		mouseX,
		mouseY,
		gridSize, // i.e. columns
		gridSize, // i.e. rows
		_sqSize,
		_gridStartPositions
	);
	console.log('### coords:: =', coords);

	// if we're clicking within grid
	if (coords) {
		_checkForCollision = true;
	}
}

function mouseReleased() {
	_checkForCollision = false;

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		cell.inCollision = false;
	}
}

const updatePositions = function () {
	if (_checkForCollision) {
		checkForCollision();
	}

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];

		move(cell, i);
	}
};

const checkForCollision = function () {
	const spring = 0.05;

	const numCells = _cells.length;

	for (let i = 0; i < numCells - 1; i++) {
		const cell0 = _cells[i];

		cell0.inCollision = false;

		for (let j = i + 1; j < numCells; j++) {
			const cell1 = _cells[j];

			cell1.inCollision = false;

			const dx = cell1.x - cell0.x;
			const dy = cell1.y - cell0.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const minDist = cell0.radius + cell1.radius;

			if (dist <= minDist) {
				// const angle = Math.atan2(dy, dx);
				const tx = cell0.x + (dx / dist) * minDist;
				const ty = cell0.y + (dy / dist) * minDist;
				const ax = (tx - cell1.x) * spring;
				const ay = (ty - cell1.y) * spring;
				cell0.vx -= ax * _speed;
				cell0.vy -= ay * _speed;
				cell1.vx += ax * _speed;
				cell1.vy += ay * _speed;
				//
				cell0.inCollision = true;
				cell1.inCollision = true;
			} else {
				cell1.inCollision = false;
			}
		}
	}
};

const move = function (cell, index) {
	const easing = 0.08;
	const bounce = -1;

	if (_gotoTarget) {
		// If image is not undergoing collision calculations - set it on it's way to it's target position
		if (!cell.inCollision) {
			const dx = cell.targetX - cell.x;
			const dy = cell.targetY - cell.y;

			cell.vx = dx * easing;
			cell.vy = dy * easing;
		}
	}

	// Change the img's position by its new velocity
	cell.x += cell.vx * _speed;
	cell.y += cell.vy * _speed;
};

// Create a grid "outline" i.e. only draw the squares that represent the outer edge of the grid
// TODO pass _centerX & _centerY as args
function createGridOutline(
	pColumns,
	pRows,
	pStartX,
	pStartY,
	pSqSize,
	pMaxDistFromCenter,
	pCellsArray
) {
	let sqCount = 0;
	for (let i = 0; i < pColumns; i++) {
		for (let j = 0; j < pRows; j++) {
			// Only draw outer colums and rows
			if (i === 0 || i === pColumns - 1 || j === 0 || j === pRows - 1) {
				const x = pStartX + pSqSize * i;
				const y = pStartY + pSqSize * j;

				// Calculate the distance of the starting square from the centre point
				const dx = pStartX - _centerX;
				const dy = pStartY - _centerY;
				const dist = Math.sqrt(dx * dx + dy * dy);

				let cell = createCell(
					x,
					y,
					pSqSize,
					pColumns, // use columns as an indicator of grid size (we're presuming a square grid)
					dist,
					pMaxDistFromCenter
				);
				// Store the cell in a master array
				pCellsArray.push(cell);

				// Also keep a reference to the cell: placing it in an array that's at an index that matches the cell's grid size
				_cellsByGridSize[cell.gridSize].push(cell);

				// Count how many squares we're creating in each "outline"
				sqCount++;
			}
		}
	}
	return sqCount;
}

// TODO - either use gloabl vars everywhere *or* pass as args
// _blueColor & _greenColor
// _canvasW & _canvasH
const createCell = function (
	pX,
	pY,
	pSqSize,
	pColumns,
	pDist,
	pMaxDistFromCenter
) {
	const collisionPadding = 0;
	const imageW = pSqSize + collisionPadding; // make border we use to detect collision slightly larger that actual square
	const imageH = pSqSize + collisionPadding;

	// Now we know the maximum distance a square can be from the centre
	// - generate a stroke colour based on that distance
	let outerStrokeColor;
	let innerStrokeColor;

	const chance = (pDist / pMaxDistFromCenter) * 100;

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

function drawCell(pCell, pSqSize, pUnit) {
	if (_inAGeorgNeesStylee) {
		stroke(pCell.outerStrokeColor);
		square(pCell.x, pCell.y, pUnit * 7);

		stroke(pCell.innerStrokeColor);
		square(pCell.x, pCell.y, pUnit * 3);
	} else {
		stroke(_greenColor);
		square(pCell.x, pCell.y, pSqSize);
	}
}

function getGridCell(
	pMouseX,
	pMouseY,
	pColumns,
	pRows,
	pSqSize,
	pGridStartPositions
) {
	const firstCell = pGridStartPositions[pGridStartPositions.length - 1];

	const startX = firstCell[0];
	const startY = firstCell[1];

	// const col = floor(pMouseX / size); // is the regular way
	// But, we need to take into account where we've started drawing the squares from (startX)
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

function generateCellRadialDistances(pCells, pGridSizes, pGridSquaresCount) {
	// For each cell, we can use it's .gridSize to work out how many squares are in it's grid...
	// - get cells gridSize,
	// - find the corresponding index in the _gridSizes array
	// - use that index against the pGridSquaresCount array to extract the number of squares in that grid
	// for (let i = 0; i < pCells.length; i++) {
	// 	const cell = pCells[i];
	// 	const gridSize = cell.gridSize;

	// 	const gridSizeIndex = pGridSizes.indexOf(gridSize);

	// 	const numSquares = pGridSquaresCount[gridSizeIndex];

	// 	console.log(
	// 		'### :: gridSize:: gridSizeIndex:: numSquares=',
	// 		gridSize,
	// 		gridSizeIndex,
	// 		numSquares
	// 	);

	// 	circleRadius = 0;

	// 	for (var k = 0; k < numSquares; k++) {
	// 		const theta = (k * TWO_PI) / numSquares; // radial angle of the square
	// 		const radialTargetX = _centerX + circleRadius * cos(theta);
	// 		const radialTargetY = _centerY + circleRadius * sin(theta);
	// 	}
	// }

	// Loop through gridSizes array
	// Use each value as an index to reference the cells stored in _cellsByGridSize
	// The number in each array would be the value for numSquares
	// Still need to work out a set of suitable circle radii

	// i=1 means ignore the 1x1 grid
	for (let i = 1; i < pGridSizes.length; i++) {
		let gridSize = pGridSizes[i];
		const cellsArr = _cellsByGridSize[gridSize];

		console.log('### cellsArr:: =', cellsArr);

		let circleRadius = 15.55 * gridSize;

		let numSquares = cellsArr.length;

		for (var k = 0; k < numSquares; k++) {
			const theta = (k * TWO_PI) / numSquares; // radial angle of the square
			const radialTargetX = _centerX + circleRadius * cos(theta);
			const radialTargetY = _centerY + circleRadius * sin(theta);

			let cell = cellsArr[k];
			cell.radialTargetX = radialTargetX;
			cell.radialTargetY = radialTargetY;

			// push(); // save the current transform
			// translate(cell.radialTargetX, cell.radialTargetY); // move to cell centre

			// rotate(theta); // rotate around that point

			// square(0, 0, _sqSize); // since we've transformed to the squares centre, we can draw the square from there

			// pop();
		}
	}
}
