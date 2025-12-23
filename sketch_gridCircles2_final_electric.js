/**
 * Multiphased interaction relying on multiple user interaction
 * to trigger collision behaviour and move it from
 * randomly spaced cells, to a concentric grid formation to a radial grid formation
 */

const _backgroundColor = 'rgb(0, 103, 189)';
const _blueColor = 'rgb(0, 74, 183)';
const _greenColor = 'rgb(12, 167, 17)';
const _whiteColor = 'rgba(255, 255, 255, 0.7)';
const _whiteColor2 = 'rgba(255, 255, 255, 0.9)';

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
const _gridSquaresCount = []; // currently don't need this
const _cells = [];
const _cellsByGridSize = []; // currently don't need this

let _checkForCollision = false;

let _isRadialGrid = false;

let _mouseHasBeenClicked = false;

// We multiply the particle's velocity by this value so we have an overall control of the speed
const _speed = 1; // base value = 1

// Map to hold the buckets of cells
const grid = new Map();

// Bucket size
// 12 & the whole grid starts to shake || 20 and the motion starts from the outside layer
// 40 is like 20 but more so, it gives it a real pulse as you click and let go
let _bucketSize = 12;

/**
 * Phase 0 = start: cells in random pos, waiting for click to send them to regular grid
 * Phase 1 = regular grid, small bucket size (giving "fragmented" collision effect). Waiting for sufficient movement to send them to next phase
 * Phase 2 = regular grid, cells drawn rotated, larger bucket size (giving "pulsing" effect). Waiting for sufficient movement to send them to next phase
 * Phase 3 = radial grid. Waiting for sufficient movement to send them to next phase
 * Phase 4 = radial grid, but enough motion will cause the cells to drift off (& snap back when the mouse is released)
 */
let _phase = 0;

function setup() {
	createCanvas(_canvasW, _canvasH);
	background(_backgroundColor);

	strokeWeight(2);

	noFill();

	rectMode(CENTER); // draw square from centre

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

		_gridStartPositions.push([gridStartX, gridStartY]);
	}

	// Calc top left square's dist from centre point
	const lastGridCell = _gridStartPositions[_gridStartPositions.length - 1];
	const dx = lastGridCell[0] - _centerX;
	const dy = lastGridCell[1] - _centerY;
	_maxDistFromCenter = sqrt(dx * dx + dy * dy) + _sqSize / 4; // add _sqSize / 4 to allow *some* chance of green on the outer squares

	// Loop thru the grid sizes & start positions to create a series of grid outlines
	for (let i = 0; i < _gridSizes.length; i++) {
		const gridSize = _gridSizes[i];

		const [gridStartX, gridStartY] = _gridStartPositions[i];

		// Create grid outline (will go on to create individual cells, populating _cells array)
		const numSquaresCreated = createGridOutline(
			gridSize,
			gridSize,
			gridStartX,
			gridStartY
		);
		_gridSquaresCount.push(numSquaresCreated);
	}

	// console.log('### :: _gridSizes=', _gridSizes);
	// console.log('### :: _cellsByGridSize=', _cellsByGridSize);
	// console.log('### :: gridStartPositions=', _gridStartPositions);
	// console.log('### :: _gridSquaresCount=', _gridSquaresCount);
	// console.log('### :: _cells=', _cells);

	noLoop(); // only run draw code once
}

function draw() {
	background(_backgroundColor);

	// Regular loop (and one-off draw at start)
	// - calculate cell positions...
	updatePositions();
	// ... then draw them
	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];

		if (_phase >= 2) {
			drawRotatedCell(cell);
		} else {
			drawCell(cell); // drawCell(cell, i === 0) // to draw first cell in white
		}
	}

	// At start draw white square in centre
	if (_phase === 0 && !_mouseHasBeenClicked) {
		drawCell({ x: _centerX, y: _centerY }, true);
		return;
	}

	// Draw white square as mouse moves over grid
	if (!_checkForCollision && _phase >= 1) {
		// Using getRadialCell also works for regular grid because all cells are generated with
		// rotation related properties - we just don't apply that rotation when we draw the regular grid.
		// However the hit test algorithm always looks at the rotation properties and ignores, or rather inverses,
		// them to make each square it checks a regular axis aligned square
		const hit = getRadialCell(mouseX, mouseY, _cells, _sqSize);
		if (hit) {
			if (_phase >= 2) {
				drawRotatedCell(hit.cell, true);
			} else {
				drawCell(hit.cell, true);
			}
		}
	}

	// Triggers for next phase... detect if cells are sufficiently in motion by picking first cell
	// and seeing how far it has moved out of position
	if (_checkForCollision) {
		// If in phase1 (regular grid)
		if (_phase === 1) {
			// check if first cell has moved enough
			if (checkForCellMotion(_cells[0])) {
				// console.log('### HAS MOVED ENOUGH!!!!!');
				setPhase(2);
				return;
			}
		}

		if (_phase === 2) {
			if (checkForCellMotion(_cells[0])) {
				// console.log('### HAS MOVED ENOUGH AGAIN!!!!!');
				setPhase(3); // send to radial grid
				return;
			}
		}

		if (_phase >= 3) {
			if (checkForCellMotion(_cells[0])) {
				// console.log('### HAS MOVED ENOUGH AGAIN AGAIN!!!!!');
				setPhase(4);
				return;
			}
		}
	}
}

// Already uses p5 globals like stroke & square, so can use other globals
function drawCell(pCell, pIsWhite) {
	// One batch extraction of props
	const { x, y, outerStrokeColor, innerStrokeColor, isElectrified } = pCell;

	strokeWeight(2);
	let whiteColor = _whiteColor;

	let drawWhite = pIsWhite;

	if (isElectrified) {
		drawWhite = true;
		strokeWeight(1);
		// whiteColor = _whiteColor2;
	}

	if (drawWhite) {
		stroke(whiteColor);
		square(x, y, _sqSize);
	} else if (_inAGeorgNeesStylee) {
		stroke(outerStrokeColor);
		square(x, y, _unit * 7);

		stroke(innerStrokeColor);
		square(x, y, _unit * 3);
	} else {
		stroke(_greenColor);
		square(x, y, _sqSize);
	}
}

// Already uses p5 globals like stroke & square, so can use other globals
function drawRotatedCell(pCell, pIsWhite) {
	const { x, y, outerStrokeColor, innerStrokeColor, theta, isElectrified } =
		pCell;

	strokeWeight(2);
	let whiteColor = _whiteColor;

	let drawWhite = pIsWhite;

	if (isElectrified) {
		drawWhite = true;
		strokeWeight(1);
		// whiteColor = _whiteColor2;
	}

	push(); // save the current transform

	translate(x, y); // move to cell centre

	rotate(theta); // rotate around that point

	if (drawWhite) {
		stroke(whiteColor);
		square(0, 0, _sqSize);
	} else if (_inAGeorgNeesStylee) {
		stroke(outerStrokeColor);
		square(0, 0, _unit * 7); // since we've transformed to the square's centre, we can draw the square from there

		stroke(innerStrokeColor);
		square(0, 0, _unit * 3);
	} else {
		stroke(_greenColor);
		square(0, 0, _sqSize);
	}

	pop();
}

const updatePositions = function () {
	if (_checkForCollision) {
		checkForCollision(_cells);
		checkForElectrification();
	}

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		move(cell);
	}
};

/**
 * Uniform Spatial Hash Grid collision detection aka Spatial Partitioning
 * Assign each cell to a grid bucket based on its position
 * Instead of checking every cell against every other cell on each frame
 * just check each cell against its 8 immediate neighbours
 * (or a bucket against the 8 neighbouring buckets)
 *
 * Reduces total checks from O(n²) to O(n) average.
 */
function checkForCollision(cells) {
	buildGrid(cells); // Rebuild buckets as cells are in motion, to determine the new neighbouring cells

	const spring = 0.05;

	for (const c0 of cells) {
		c0.inCollision = false;
		// c0.isElectrified = false;

		const gx = Math.floor(c0.x / _bucketSize);
		const gy = Math.floor(c0.y / _bucketSize);

		// Check same bucket + 8 surrounding buckets:
		// i.e same bucket plus one to left and one to right on x-axis
		// & same bucket plus one above and one below on y-axis
		for (let ox = -1; ox <= 1; ox++) {
			for (let oy = -1; oy <= 1; oy++) {
				const key = hash(gx + ox, gy + oy);
				const bucket = grid.get(key);
				if (!bucket) continue;

				// Loop only the cells *in this bucket*
				for (const c1 of bucket) {
					if (c1 === c0) continue;

					// --- circle collision
					const dx = c1.x - c0.x;
					const dy = c1.y - c0.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					const minDist = c0.radius + c1.radius;

					if (dist < minDist) {
						const tx = c0.x + (dx / dist) * minDist;
						const ty = c0.y + (dy / dist) * minDist;
						const ax = (tx - c1.x) * spring;
						const ay = (ty - c1.y) * spring;

						c0.vx -= ax * _speed;
						c0.vy -= ay * _speed;
						c1.vx += ax * _speed;
						c1.vy += ay * _speed;

						c0.inCollision = c1.inCollision = true;

						// if (checkForCellMotion(c0, 2)) {
						// 	c0.isElectrified = true;
						// }
						// if (checkForCellMotion(c1, 2)) {
						// 	c1.isElectrified = true;
						// }
					}
				}
			}
		}
	}
}

function move(pCell) {
	// One batch extraction of props
	let { x, y, vx, vy, targetX, targetY, inCollision } = pCell;

	const easing = 0.08;

	// Skip target movement if in collision
	if (!inCollision) {
		const dx = targetX - x;
		const dy = targetY - y;

		// Skip updating velocity entirely if the cell is already close to its target
		if (abs(dx) < 0.1 && abs(dy) < 0.1) {
			pCell.vx = 0;
			pCell.vy = 0;
			// and snap to target
			pCell.x = targetX;
			pCell.y = targetY;
			return;
		}

		vx = dx * easing;
		vy = dy * easing;
	}

	// Move (change the cell's position by its new velocity)
	x += vx * _speed;
	y += vy * _speed;

	// Write properties back once
	pCell.x = x;
	pCell.y = y;
	pCell.vx = vx;
	pCell.vy = vy;
}

function mousePressed() {
	// At start, check if central white square has been clicked
	if (_phase === 0) {
		let h = _sqSize / 2;
		if (
			mouseX >= _centerX - h &&
			mouseX <= _centerX + h &&
			mouseY >= _centerY - h &&
			mouseY <= _centerY + h
		) {
			loop(); // start continuous draw loop

			// if it has, move to next phase
			setPhase(1);

			_mouseHasBeenClicked = true; // Along with phase change, this will stop drawing white square in centre
		}

		return;
	}

	// console.log('### mouseX:: =', mouseX);
	// console.log('### mouseY:: =', mouseY);

	const coords = getRadialCell(mouseX, mouseY, _cells, _sqSize);

	// console.log('### coords:: =', coords);

	// If we're clicking within either type of grid
	if (coords) {
		_checkForCollision = true;
	}
}

function mouseReleased() {
	_checkForCollision = false;
	resetCellInCollisionProp();
	resetCellIsElectrifiedProp();
}

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
					dist,
					sqCount
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
const createCell = function (
	pGridTargetX,
	pGridTargetY,
	pColumns,
	pDist,
	pSqCount
) {
	const collisionPadding = 0;
	const imageW = _sqSize + collisionPadding; // make border we use to detect collision slightly larger that actual square
	const imageH = _sqSize + collisionPadding;

	const gridSize = pColumns; // store in new var with more semantically meaningful name

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

	let circleRadius = gridSize * _sqSize * 0.55;

	let index = _gridSizes.indexOf(gridSize);
	let prevGridSize = index === 0 ? 1 : _gridSizes[index - 1];

	// The number of squares in each grid outline can be calculated by considering the outer grid as a full grid
	// and then subtracting the previous grid from it
	let numSquares = sq(gridSize) - sq(prevGridSize);

	// Now we know the number of squares in each grid outline, we can calculate their radial distances if we want to arrange them in a circle
	let theta = (pSqCount * TWO_PI) / numSquares; // radial angle of the square
	// theta -= HALF_PI; // to start drawing from the 12 o'clock position instead of the 3 o'clock
	theta -= gridSize * (HALF_PI / 2);

	const radialTargetX = round(_centerX + circleRadius * cos(theta));
	const radialTargetY = round(_centerY + circleRadius * sin(theta));

	const { x: randomXPos, y: randomYPos } = getRandomPositions(imageW, imageH);

	const cellObj = {
		width: imageW,
		height: imageH,
		radius: sqrt(imageW * imageW + imageH * imageH) / 2,
		x: randomXPos,
		y: randomYPos,
		vx: random() * 6 - 3,
		vy: random() * 6 - 3,
		randomXPos,
		randomYPos,
		gridTargetX: pGridTargetX,
		gridTargetY: pGridTargetY,
		radialTargetX: round(radialTargetX),
		radialTargetY: round(radialTargetY),
		theta,
		circleRadius,
		// Inverse rotation point: the point *opposite* the square’s rotation
		// - since this never changes we can precompute it (means the hit test in getRadialCell > hitRotatedSquare can be optimised)
		// Explanation:
		// The square is rotated by `angle` (theta).
		// To align it back to axis-aligned orientation (for the hit test), we rotate the point in the
		// *opposite* direction (−theta).
		cosR: cos(-theta),
		sinR: sin(-theta),
		targetX: pGridTargetX,
		targetY: pGridTargetY,
		inCollision: false,
		gridSize: pColumns, // use columns as an indicator of grid size (we're presuming a square grid)
		distFromCenter: pDist,
		outerStrokeColor,
		innerStrokeColor,
		isElectrified: false,
	};

	return cellObj;
};

function getRadialCell(pMouseX, pMouseY, pCells, pSqSize) {
	for (let i = 0; i < pCells.length; i++) {
		const cell = pCells[i];

		const { x, y, cosR, sinR } = cell;

		if (hitRotatedSquare(pMouseX, pMouseY, x, y, pSqSize, cosR, sinR)) {
			return { x, y, cell };
		}
	}

	return null;
}
/**
 * Check whether a point (px, py) lies inside a rotated square whose centre is cx, cy
 * @param {number} cosR - Inverse rotation of the square in radians
 * @param {number} sinR - Inverse rotation of the square in radians
 * @returns {boolean} True if the point lies inside the rotated square
 */
function hitRotatedSquare(px, py, cx, cy, size, cosR, sinR) {
	// Translate point into cell coordinate system
	let dx = px - cx;
	let dy = py - cy;

	// Inverse rotate point
	// Rotate the point around (0,0) using its inverse rotation
	let rx = dx * cosR - dy * sinR;
	let ry = dx * sinR + dy * cosR;

	// After unrotating, the square is now just a regular axis-aligned square
	// centered at (0,0).
	// So the boundaries are:
	//    -size/2  <=  rx  <=  size/2
	//    -size/2  <=  ry  <=  size/2
	let h = size / 2;

	// And we can do a simple axis-aligned boundary check
	return rx >= -h && rx <= h && ry >= -h && ry <= h;
}

function getRandomPositions(pImageW, pImageH) {
	// -imageW & -imageH keeps the initial position within the canvas

	const ranX = random() * (_canvasW - pImageW);
	const ranY = random() * (_canvasH - pImageH);

	return {
		x: round(ranX),
		y: round(ranY),
	};
}

// Convert grid coords to a unique key
function hash(x, y) {
	return `${x},${y}`;
}

// Subdivide the grid into an arbitrary set of buckets (based on _bucketSize)
// Then group cells into these buckets based on their x,y positions
//
// Every cell ends up in the bucket corresponding to the _bucketSize x _bucketSize region it sits inside.
function buildGrid(cells) {
	grid.clear(); // reset all buckets for this frame

	for (const c of cells) {
		// 1. Determine which grid square (bucket) this cell belongs in
		const gx = Math.floor(c.x / _bucketSize);
		const gy = Math.floor(c.y / _bucketSize);

		// 2. Create a unique string key for that bucket
		const key = hash(gx, gy);

		// 3. If the bucket doesn't exist yet, create it
		if (!grid.has(key)) grid.set(key, []);

		// 4. Put the cell into the correct bucket
		grid.get(key).push(c);
	}
}

/**
 * Phase 0 = start: cells in random pos, waiting for click to send them to regular grid
 * Phase 1 = regular grid, small bucket size (giving "fragmented" collision effect). Waiting for sufficient movement to send them to next phase
 * Phase 2 = regular grid, cells drawn rotated, larger bucket size (giving "pulsing" effect). Waiting for sufficient movement to send them to next phase
 * Phase 3 = radial grid
 * Phase 4 = radial grid, but enough motion will cause the cells to drift off (& snap back when the mouse is released)
 */
function setPhase(val) {
	// Delay setting phase to 1 to stop the drawing of the white square over the individual cells
	// as they first move to the regular grid position
	if (_phase === 0) {
		setTimeout(() => {
			_phase = val;
		}, 1000);
	} else {
		_phase = val;
	}

	// On switch to regualr grid, but rotated cells - stop the collision detection so we can see the effect
	if (_phase === 2) {
		_checkForCollision = false;
		resetCellInCollisionProp();
		_bucketSize = 80;
	}

	if (_phase === 3) {
		_bucketSize = 40;
		_isRadialGrid = true;

		_checkForCollision = false;

		// Using a timeout lets cells drift away before snapping to radial grid
		// This eases the transition from the regular to radial grid (otherwise there's a bit of a weird "crossover")
		setTimeout(() => {
			resetCellInCollisionProp();

			// Change cell's target positions to the radial ones
			for (let i = 0; i < _cells.length; i++) {
				const cell = _cells[i];
				cell.targetX = cell.radialTargetX;
				cell.targetY = cell.radialTargetY;
			}
		}, 300);
	}

	if (_phase === 4) {
		_checkForCollision = false;
		resetCellIsElectrifiedProp();
	}
}

function checkForElectrification() {
	// in phase one reduce the amount a cell needs to move in order to be electrified
	// for other phases increase it
	const divider = _phase === 1 ? 2 : 0.8;

	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		if (cell.inCollision) {
			cell.isElectrified = checkForCellMotion(cell, divider);
		} else {
			cell.isElectrified = false;
		}
	}
}

function resetCellIsElectrifiedProp() {
	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		cell.isElectrified = false;
	}
}

function resetCellInCollisionProp() {
	for (let i = 0; i < _cells.length; i++) {
		const cell = _cells[i];
		cell.inCollision = false;
		cell.isElectrified = false;
	}
}

// monitor if "test" cell has moved a sufficient distance (a (half) square on the x & y from where it was)
function checkForCellMotion(pCell, pDivider = 1) {
	let moveDist = _sqSize / pDivider; // / 2;
	let { x, y, targetX, targetY } = pCell;

	const xMin = targetX - moveDist;
	const xMax = targetX + moveDist;
	const yMin = targetY - moveDist;
	const yMax = targetY + moveDist;

	// console.log('\n### :: xMin, xMax=', xMin, xMax);
	// console.log('### :: yMin, yMax=', yMin, yMax);
	// console.log('### x,y:: =', round(x), round(y));

	if ((x <= xMin || x >= xMax) && (y <= yMin || y >= yMax)) {
		return true;
	}
	return false;
}
