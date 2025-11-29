const _backgroundColor = 'rgb(0, 103, 189)';
const _greenColor = 'rgb(12, 167, 17)';

const _canvasW = 1000;
const _canvasH = 600;

const _sqSize = 20;

function setup() {
	createCanvas(_canvasW, _canvasH);
	background(_backgroundColor);

	strokeWeight(2);
	stroke(_greenColor);

	noFill();

	rectMode(CENTER); // draw square from centre

	// Draw a rectangle at coordinates (50, 0).
	// rect(50, 0, 40, 20);

	// square(100, 100, 80);

	// arrangeSquaresInCircle(20, _sqSize, _canvasW / 2, _canvasH / 2, 200);
	// arrangeSquaresInCircle(20, _sqSize, _canvasW / 2, _canvasH / 2, 175);

	// arrangeSquaresInCircle(100, 20, _canvasW / 2, _canvasH / 2, 160);
	// arrangeSquaresInCircle(81, 20, _canvasW / 2, _canvasH / 2, 140);
	// arrangeSquaresInCircle(64, 20, _canvasW / 2, _canvasH / 2, 120);
	// arrangeSquaresInCircle(49, 20, _canvasW / 2, _canvasH / 2, 100);
	// arrangeSquaresInCircle(36, 20, _canvasW / 2, _canvasH / 2, 80);
	// arrangeSquaresInCircle(25, 20, _canvasW / 2, _canvasH / 2, 60);
	// arrangeSquaresInCircle(16, 20, _canvasW / 2, _canvasH / 2, 40);
	// arrangeSquaresInCircle(9, 20, _canvasW / 2, _canvasH / 2, 20);
	// arrangeSquaresInCircle(4, 20, _canvasW / 2, _canvasH / 2, 5);
	// arrangeSquaresInCircle(1, 20, _canvasW / 2, _canvasH / 2, 0);

	// // console.log(sq(2));

	// for (let i = 10; i > 0; i--) {
	// 	arrangeSquaresInCircle(
	// 		sq(i),
	// 		20,
	// 		_canvasW / 2 + 300,
	// 		_canvasH / 2,
	// 		// pow(i, 3) / 3
	// 		sq(i) * 1.5
	// 	);
	// }

	// for (let i = 200; i > 0; i -= 25) {
	// 	// arrangeSquaresInCircle(20, _sqSize, _canvasW / 2, _canvasH / 2, i);

	// 	arrangeSquaresInCircle(
	// 		floor(i / 5),
	// 		_sqSize,
	// 		_canvasW / 2,
	// 		_canvasH / 2,
	// 		i
	// 	);
	// }

	// arrangeSquaresInCircle(8, 20, _canvasW / 2, _canvasH / 2, 25);
	// arrangeSquaresInCircle(16, 20, _canvasW / 2, _canvasH / 2, 50);
	// arrangeSquaresInCircle(24, 20, _canvasW / 2, _canvasH / 2, 75);
	// arrangeSquaresInCircle(32, 20, _canvasW / 2, _canvasH / 2, 100);
	// arrangeSquaresInCircle(40, 20, _canvasW / 2, _canvasH / 2, 1225);

	for (let i = 2; i < 27; i++) {
		// console.log('i=', i, 'sq(i)=', sq(i), 'sq(i-2)=', sq(i - 2));

		// if (i % 2 !== 1) continue;

		let sum = sq(i) - sq(i - 2);
		console.log('i=', i, sum);

		let sp = i;

		if (i % 2 === 1) {
			arrangeSquaresInCircle(
				sum,
				20,
				_canvasW / 2,
				_canvasH / 2,
				(sp - 1) * 10
			);
		}
	}

	// stroke('white');
	square(_canvasW / 2, _canvasH / 2, 20);
}

const arrangeSquaresInCircle = function (
	pNumSquares,
	psqSize,
	pStartX,
	pStartY,
	pCircleRadius
) {
	for (var i = 0; i < pNumSquares; i++) {
		const theta = (i * TWO_PI) / pNumSquares; // radial angle of the square

		const targetX = pStartX + pCircleRadius * cos(theta);
		const targetY = pStartY + pCircleRadius * sin(theta);

		push(); // save the current transform
		translate(targetX, targetY); // move to cell centre

		rotate(theta); // rotate around that point

		// if (i % 2 === 1) {
		square(0, 0, psqSize); // since we've transformed to the squares centre, we can draw the square from there
		// }

		pop(); // restore the original transform
	}
};
