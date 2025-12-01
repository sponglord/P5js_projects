const _backgroundColor = 'rgb(0, 103, 189)';
const _blueColor = 'rgb(0, 74, 183)';
const _greenColor = 'rgb(12, 167, 17)';
const _whiteColor = 'rgba(255, 255, 255, 0.7)';

const _canvasW = 1000;
const _canvasH = 600;

const _sqSize = 20;
const unit = _sqSize / 9;

const _centerX = _canvasW / 2;
const _centerY = _canvasH / 2;

let _maxDistFromCenter = null;

const _gridSizes = [];
const _gridStartPositions = [];
const _cells = [];

let _checkForCollision = false;
let _gotoTarget = true;

// We multiply the particle's velocity by this value so we have an overall control of the speed
const _speed = 1; // base value = 1

function setup() {
	createCanvas(_canvasW, _canvasH);
	background(_backgroundColor);

	strokeWeight(2);
	stroke(_greenColor);

	noFill();

	// noLoop(); // only run draw code once

	rectMode(CENTER); // draw square from centre

	// createEdgedGrid(3, 3, 10, 10, _sqSize);

	for (let i = 1; i <= 16; i += 2) {
		// 1, 3, 5, 7, 9...
		_gridSizes.push(i);
	}

	for (let i = 0; i < _gridSizes.length; i++) {
		const gridSize = _gridSizes[i];

		console.log('\n### gridSize:: =', gridSize);

		// create set of start coords starting at centre and moving 1.5 square up and to the left on each tick
		let gridStartX = _centerX - _sqSize * (gridSize / 2);
		let gridStartY = _centerY - _sqSize * (gridSize / 2);

		// When rectMode = CENTER we have to adjust positions by half a square
		// (keeps grid drawn centrally on canvas)
		gridStartX += _sqSize / 2;
		gridStartY += _sqSize / 2;

		console.log('### gridStartX:: =', gridStartX);
		console.log('### gridStartY:: =', gridStartY);

		// create edged grid
		createEdgedGrid(gridSize, gridSize, gridStartX, gridStartY, _sqSize, i);

		_gridStartPositions.push([gridStartX, gridStartY]);
	}

	// console.log('### :: gridStartPositions=', _gridStartPositions);

	const lastGridCell = _gridStartPositions[_gridStartPositions.length - 1];

	// Calc top left square's dist from centre point
	const dx = lastGridCell[0] - _centerX;
	const dy = lastGridCell[1] - _centerY;
	_maxDistFromCenter = Math.sqrt(dx * dx + dy * dy) + _sqSize / 4; // add _sqSize / 4 to allow *some* chance of green on the outer squares

	// For each cell calculate a stroke color base on their distance from the centre
	// - more chance of blue further from centre, & green closer
	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];

		let outerStrokeColor;
		let innerStrokeColor;

		const chance = (cell.distFromCenter / _maxDistFromCenter) * 100;

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

		cell.outerStrokeColor = outerStrokeColor;
		cell.innerStrokeColor = innerStrokeColor;
	}
}

function draw() {
	background(_backgroundColor);

	updatePositions();

	// stroke(_greenColor);

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		drawCell(cell, _sqSize);
	}

	// if (_checkForCollision) {
	const gridSize = _gridSizes[_gridSizes.length - 1];
	const coords = getGridCell(mouseX, mouseY, gridSize, gridSize, _sqSize);
	// console.log('### coords:: =', coords);

	if (coords) {
		stroke(_whiteColor);
		square(coords.cellX, coords.cellY, _sqSize);
	}
}

function mousePressed() {
	console.log('### mouseX:: =', mouseX);
	console.log('### mouseY:: =', mouseY);

	const gridSize = _gridSizes[_gridSizes.length - 1];
	const coords = getGridCell(mouseX, mouseY, gridSize, gridSize, _sqSize);
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
		// If image is not undergoing collision calculations - set it on it's way to it's final position
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

	// Border detection
	// const rad = 2;

	// if (!_gotoTarget) {
	// 	if (cell.x + rad > _canvasW) {
	// 		cell.x = _canvasW - rad;
	// 		cell.vx *= bounce;
	// 	} else if (cell.x - rad < 0) {
	// 		cell.x = rad;
	// 		cell.vx *= bounce;
	// 	}
	// 	if (cell.y + rad > _canvasH) {
	// 		cell.y = _canvasH - rad;
	// 		cell.vy *= bounce;
	// 	} else if (cell.y - rad < 0) {
	// 		cell.y = rad;
	// 		cell.vy *= bounce;
	// 	}
	// }
};

function createEdgedGrid(pColumns, pRows, pStartX, pStartY, pSize, count = 0) {
	for (let i = 0; i < pColumns; i++) {
		for (let j = 0; j < pRows; j++) {
			// Draw outer colums and rows
			if (i === 0 || i === pColumns - 1 || j === 0 || j === pRows - 1) {
				const x = pStartX + pSize * i;
				const y = pStartY + pSize * j;

				// Calc distance from centre point of starting square
				const dx = pStartX - _centerX;
				const dy = pStartY - _centerY;
				const dist = Math.sqrt(dx * dx + dy * dy);

				createCell(x, y, pSize, pColumns, dist);
			}
		}
	}
}

// TODO - either use gloabl vars everywhere *or* pass _cells as arg
const createCell = function (pX, pY, pSize, pColumns, pDist) {
	const collisionPadding = 0;
	const imageW = pSize + collisionPadding; // make border we use to detect collision slightly larger that actual square
	const imageH = pSize + collisionPadding;

	const cellObj = {
		width: imageW,
		height: imageH,
		radius: Math.sqrt(imageW * imageW + imageH * imageH) / 2,
		// x: pX,
		// y: pY,
		x: Math.random() * (_canvasW - imageW), // - _imageW keeps the initial position within the canvas
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
		gridSize: pColumns,
		distFromCenter: pDist,
		outerStrokeColor: null,
	};

	_cells.push(cellObj);
};

function drawCell(pCell, pSqSize) {
	stroke(pCell.outerStrokeColor);
	square(pCell.x, pCell.y, unit * 7);

	stroke(pCell.innerStrokeColor);
	square(pCell.x, pCell.y, unit * 3);

	// square(pCell.x, pCell.y, pSqSize);
}

// TODO - either use gloabl vars everywhere *or* pass _gridStartPositions as arg
function getGridCell(_mouseX, _mouseY, pColumns, pRows, pSize) {
	const firstCell = _gridStartPositions[_gridStartPositions.length - 1];

	const startX = firstCell[0];
	const startY = firstCell[1];

	// const col = floor(_mouseX / size); // is the regular way
	// But, we need to take into account where we've started drawing the squares from (startX)
	// and the fact that we're drawing the squares from the centre, not the top left (pSize / 2)
	const adjustedMouseX = _mouseX - startX + pSize / 2;
	const adjustedMouseY = _mouseY - startY + pSize / 2;

	const col = floor(adjustedMouseX / pSize);
	const row = floor(adjustedMouseY / pSize);

	const cellX = startX + col * pSize;
	const cellY = startY + row * pSize;

	if (col >= 0 && col < pColumns && row >= 0 && row < pRows) {
		return { col, row, cellX, cellY };
	}
	return null;
}
