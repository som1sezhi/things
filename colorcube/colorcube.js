const CIRCLE_RES = 32;

// camera position/angles
let polar = 0.;
let azi = 0.;
let rad = 4.;

let selectedColor = null;

const topBox = document.getElementById('top-box');
const colorBox = document.getElementById('color-box');
const colorText = document.getElementById('color-text');
const checkboxSphere = document.getElementById('checkbox-sphere');
const sliderScale = document.getElementById('slider-scale');

function main() {
	const canvas = document.getElementById('canvas');
	const gl = canvas.getContext('webgl', {alpha:false, antialias:true});
	if (gl === null) {
		alert('no webgl!');
		return;
	}
	gl.getExtension('OES_standard_derivatives');
	gl.enable(gl.BLEND);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	const vsSource = document.querySelector('#vertex-shader').innerHTML;
	const fsSource = document.querySelector('#fragment-shader').innerHTML;
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	const programInfo = {
		program: shaderProgram,
		attribLocs: {
			pos: gl.getAttribLocation(shaderProgram, 'aPos'),
		},
		uniformLocs: {
			pointColor: gl.getUniformLocation(shaderProgram, 'uPointColor'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			isOutline: gl.getUniformLocation(shaderProgram, 'uIsOutline'),
			sphere: gl.getUniformLocation(shaderProgram, 'uSphere'),
			scale: gl.getUniformLocation(shaderProgram, 'uScale'),
			time: gl.getUniformLocation(shaderProgram, 'uTime'),
		},
	};

	const buffers = initBuffers(gl);

	// mouse interaction
	let mx = 0., my = 0., pmx = 0., pmy = 0., mL = false, mStaticClick = false;
	let mouseMotionSinceDown = 0;
	canvas.addEventListener('mousemove', e => {
		var rect = canvas.getBoundingClientRect();
		mx = e.clientX - rect.left;
		my = rect.bottom - e.clientY;
		mouseMotionSinceDown += Math.abs(e.movementX) + Math.abs(e.movementY);
	});
	canvas.addEventListener('mousedown', e => {
		mL = true;
		mouseMotionSinceDown = 0;
	});
	canvas.addEventListener('mouseup', e => {
		mL = false;
		if (mouseMotionSinceDown < 8) {
			mStaticClick = true;
		}
	});
	canvas.addEventListener('wheel', e => {
		if (e.deltaY < 0) {
			rad /= 1.1;
		} else {
			rad *= 1.1;
		}
		rad = Math.max(.1, Math.min(rad, 40.));
	});

	function render(time) {
		var input = {
			x: mx,
			y: my,
			lmb: mL,
			px: pmx,
			py: pmy,
			staticClick: mStaticClick,
			time: time * 0.001,
		};
		drawScene(gl, programInfo, buffers, input);
		pmx = mx;
		pmy = my;
		mStaticClick = false;
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}


function initBuffers(gl) {
	const posBuffer = gl.createBuffer();
	let positions = [];
	for (let i = 0; i < CIRCLE_RES; i++) {
		let angle = i * 2 * Math.PI / CIRCLE_RES;
		positions.push(Math.cos(angle), Math.sin(angle));
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	return {
		pos: posBuffer,
	};
}


function resize(canvas) {
	let dispWidth = canvas.clientWidth;
	let dispHeight = canvas.clientHeight;
	if (canvas.width != dispWidth || canvas.height != dispHeight) {
		canvas.width = dispWidth;
		canvas.height = dispHeight;
	}
}


function drawScene(gl, programInfo, buffers, input) {
	resize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(1/255, 1/255, 1/255, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
		Math.PI/3, gl.canvas.clientWidth / gl.canvas.clientHeight, .1, 50.);

	if (input.lmb) {
		azi += (input.x - input.px)/140.;
		polar += -(input.y - input.py)/140.;
		if (polar > Math.PI/2.) polar = Math.PI/2.;
		if (polar < -Math.PI/2.) polar = -Math.PI/2.;
	}
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix,
		[0., 0., -rad]
	);
	mat4.rotate(modelViewMatrix, modelViewMatrix,
		polar,
		[1, 0, 0]
	);
	mat4.rotate(modelViewMatrix, modelViewMatrix,
		azi,
		[0, 1, 0]
	);

	gl.useProgram(programInfo.program);

	for (const color of colors) {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
		gl.vertexAttribPointer(
			programInfo.attribLocs.pos,
			2, gl.FLOAT, false, 0, 0
		);
		gl.enableVertexAttribArray(programInfo.attribLocs.pos);

		gl.uniform3fv(programInfo.uniformLocs.pointColor, color);
		gl.uniformMatrix4fv(programInfo.uniformLocs.modelViewMatrix, false, modelViewMatrix);
		gl.uniformMatrix4fv(programInfo.uniformLocs.projectionMatrix, false, projectionMatrix);
		gl.uniform1i(programInfo.uniformLocs.isOutline, false);
		gl.uniform1i(programInfo.uniformLocs.sphere, checkboxSphere.checked);
		gl.uniform1f(programInfo.uniformLocs.scale, sliderScale.value/800);
		gl.uniform1f(programInfo.uniformLocs.time, input.time);

		gl.drawArrays(gl.TRIANGLE_FAN, 0, CIRCLE_RES);
	}

	if (input.staticClick) {
		//console.log('click');
		// stolen from webglfundamentals
		const pixelX = input.x * gl.canvas.width / gl.canvas.clientWidth;
		const pixelY = input.y * gl.canvas.height / gl.canvas.clientHeight;
		const data = new Uint8Array(4);
		gl.readPixels(pixelX, pixelY, 1 , 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
		// stolen from stackoverflow
		const hexString = ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1);
		const name = colorNames[hexString];
		if (name) {
			selectedColor = [data[0]/255, data[1]/255, data[2]/255];
			topBox.style.display = 'block';
			colorBox.style.backgroundColor = hexString;
			colorText.innerHTML =
				'<span style="color:#fff8">#' + hexString + ':</span> ' + name;
		} else {
			selectedColor = null;
			topBox.style.display = 'none';
		}
	}

	// draw outline of selected color
	if (selectedColor) {
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
		gl.vertexAttribPointer(
			programInfo.attribLocs.pos,
			2, gl.FLOAT, false, 0, 0
		);
		gl.enableVertexAttribArray(programInfo.attribLocs.pos);
		gl.uniform3fv(programInfo.uniformLocs.pointColor, selectedColor);
		gl.uniformMatrix4fv(programInfo.uniformLocs.modelViewMatrix, false, modelViewMatrix);
		gl.uniformMatrix4fv(programInfo.uniformLocs.projectionMatrix, false, projectionMatrix);
		gl.uniform1i(programInfo.uniformLocs.isOutline, true);
		gl.uniform1i(programInfo.uniformLocs.sphere, checkboxSphere.checked);
		gl.uniform1f(programInfo.uniformLocs.scale, sliderScale.value/800);
		gl.uniform1f(programInfo.uniformLocs.time, input.time);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, CIRCLE_RES);
	}
}
