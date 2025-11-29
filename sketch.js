const _backgroundColor = 'rgb(0, 103, 189)';
const _greenColor = 'rgb(12, 167, 17)';

const _canvasW = 1000;
const _canvasH = 600;

const _sqSize = 20;

const _centerX = _canvasW / 2; // - _sqSize / 2;
const _centerY = _canvasH / 2; // - _sqSize / 2;

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

	// rectMode(CENTER); // draw square from centre

	// createEdgedGrid(3, 3, 10, 10, _sqSize);

	for (let i = 3; i <= 16; i += 2) {
		// 3, 5, 7, 9, 11...
		_gridSizes.push(i);
	}

	// square(350, 150, _sqSize);
	// return;

	for (let i = 0; i < _gridSizes.length; i++) {
		const gridSize = _gridSizes[i];

		console.log('\n### gridSize:: =', gridSize);

		// create set of start coords starting at centre and moving 1.5 square up and to the left on each tick
		const gridStartX = _centerX - _sqSize * (gridSize / 2);
		const gridStartY = _centerY - _sqSize * (gridSize / 2);

		console.log('### gridStartX:: =', gridStartX);
		console.log('### gridStartY:: =', gridStartY);

		// create edged grid
		createEdgedGrid(gridSize, gridSize, gridStartX, gridStartY, _sqSize, i);

		_gridStartPositions.push([gridStartX, gridStartY]);
	}

	// console.log('### :: gridSizes=', gridSizes);
	// console.log('### :: gridStartPositions=', _gridStartPositions);
	console.log('### :: gridStartPosition=', _gridStartPositions);
}

function draw() {
	background(_backgroundColor);

	updatePositions();

	stroke(_greenColor);

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		square(cell.x, cell.y, _sqSize);
	}

	// console.log('### mouseX/Y:: =', mouseX, mouseY);

	// if (_checkForCollision) {
	// 	const gridSize = _gridSizes[_gridSizes.length - 1];
	// 	const coords = getGridCell(mouseX, mouseY, gridSize, gridSize, _sqSize);
	// 	// console.log('### coords:: =', coords);

	// 	stroke('white');
	// 	square(coords.cellX, coords.cellY, _sqSize);
	// }

	stroke('white');
	square(340, 140, 20);
	// square(470, 270, 20);
	// circle(_centerX, _centerY, 15.55 * 2);
}

function mousePressed() {
	_checkForCollision = true;

	console.log('### mouseX:: =', mouseX);
	console.log('### mouseY:: =', mouseY);

	const gridSize = _gridSizes[_gridSizes.length - 1];
	const coords = getGridCell(mouseX, mouseY, gridSize, gridSize, _sqSize);
	console.log('### coords:: =', coords);
}

function mouseReleased() {
	_checkForCollision = false;

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		cell.inCollision = false;
	}
}

function createEdgedGrid(pColumns, pRows, pStartX, pStartY, pSize, count = 0) {
	for (let i = 0; i < pColumns; i++) {
		for (let j = 0; j < pRows; j++) {
			// Draw outer colums and rows
			if (i === 0 || i === pColumns - 1 || j === 0 || j === pRows - 1) {
				const x = pStartX + pSize * i;
				const y = pStartY + pSize * j;

				// console.log('### x,y:: =', x, y);

				// if (count === 0 || count % 2 === 0) {
				// 	stroke('red');
				// } else {
				// 	stroke('yellow');
				// }

				// square(x, y, pSize);

				createCell(x, y, pSize);
			}
		}
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

const createCell = function (pX, pY, pSize) {
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
		targetX: pX,
		targetY: pY,
		inCollision: false,
	};

	// console.log('### :: cellObj.radius=', cellObj.radius);

	_cells.push(cellObj);
};

function getGridCell(_mouseX, _mouseY, pColumns, pRows, pSize) {
	const firstCell = _gridStartPositions[_gridStartPositions.length - 1];
	// console.log('### :: firstCell=', firstCell);

	const startX = firstCell[0];
	const startY = firstCell[1];

	// const col = floor(_mouseX / size); // is the regular way
	// But, we need to take into account where we've started drawing the squares from (startX)
	// and the fact that we're drawing the squares from the centre, not the top left (pSize / 2)
	const adjustedMouseX = _mouseX - startX; // - pSize / 2;
	const adjustedMouseY = _mouseY - startY; // - pSize / 2;

	const col = floor(adjustedMouseX / pSize);
	const row = floor(adjustedMouseY / pSize);

	// const col = floor((_mouseX - startX - pSize / 2) / pSize);
	// const row = floor((_mouseY - startY - pSize / 2) / pSize);

	// console.log('### _mouseX:: =', _mouseX);
	// console.log('### _mouseY:: =', _mouseY);
	// console.log('### col:: =', col);
	// console.log('### row:: =', row);

	const cellX = startX + col * pSize;
	const cellY = startY + row * pSize;

	if (col >= 0 && col < pColumns && row >= 0 && row < pRows) {
		return { col, row, cellX, cellY };
	}
	return null;
}
