let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
let imageOriginal = document.getElementById("image");

let svd;
let canvasSVD = document.createElement("canvas");
let ctxSVD = canvasSVD.getContext("2d");
let imageSVD = document.getElementById("image-svd");

let loading = document.getElementById("loading");
let instructions = document.getElementById("instructions");
let rankText = document.getElementById("rank");
let textbox = document.getElementById("textbox");
let goButton = document.getElementById("go-button");
let table = document.getElementById("table-svalues");
let checkboxResize = document.getElementById("check-resize");
let shrinkNotice = document.getElementById("shrink-notice");
const PIXEL_LIMIT = 500000;

document.getElementById("image-upload").onchange = function(e) {
	loading.innerHTML = "Loading image...";
	textbox.disabled = true;
	goButton.disabled = true;
	let target = e.target || window.event.srcElement;
	let files = target.files;

	if (FileReader && files && files.length) {
		let fr = new FileReader();
		fr.onload = () => loadAndProcessImage(fr);
		fr.readAsDataURL(files[0]);
	} else {
		loading.innerHTML = "";
	}
}

// from a FileReader, load image into canvas and do necessary initial
// processing (grayscale, calculate full SVD)
function loadAndProcessImage(fileReader) {
	let img = new Image();
	img.onload = function() {
		processImage(img);
		loading.innerHTML = "";
		updateInstructions();
		textbox.disabled = false;
		goButton.disabled = false;
	}
	img.src = fileReader.result;
}

function processImage(img) {
	// shrink image if wanted
	let width = img.width;
	let height = img.height;
	if (checkboxResize.checked && width * height > PIXEL_LIMIT) {
		let scale = Math.sqrt(PIXEL_LIMIT / (width * height));
		width = Math.round(scale * width);
		height = Math.round(scale * height);
		shrinkNotice.innerHTML = "Note: this image has been shrunk from its original size.";
	} else {
		shrinkNotice.innerHTML = "";
	}
	// load image into canvas
	canvas.width = width;
	canvas.height = height;
	canvasSVD.width = width;
	canvasSVD.height = height;
	ctx.drawImage(img, 0, 0, width, height);
	// make it grayscale
	let matArray = grayscale();
	imageOriginal.src = canvas.toDataURL();
	// calculate svd
	//loading.innerHTML = "Caluclating SVD...";
	if (width > height) {
		// calculate svd of transpose,
		// since width <= height is required for svd
		let trans = numeric.transpose(matArray);
		svd = numeric.svd(trans);
		[svd.U, svd.V] = [svd.V, svd.U];
	} else {
		svd = numeric.svd(matArray);
	}
	svd.sValues = svd.S;
	svd.S = numeric.diag(svd.S);
	reduction(1, svd.sValues.length);
}

// grayscale the image currently in canvas
// return a 2d array of the grayscale values, to be turned into a matrix later
function grayscale() {
	let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let pixels = imgData.data;

	let mat = [];
	for (let row = 0; row < imgData.height; row++) {
		let currentRow = [];
		for (let col = 0; col < imgData.width; col++) {
			let i = (row * (imgData.width * 4)) + (col * 4);
			let value = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
			let valueRounded = parseInt(value);
			pixels[i] = valueRounded;
			pixels[i + 1] = valueRounded;
			pixels[i + 2] = valueRounded;
			pixels[i + 3] = 255;
			currentRow.push(value / 255);
		}
		mat.push(currentRow);
	}
	ctx.putImageData(imgData, 0, 0);
	return mat;
}

// calculate and display dimensional reduction
function reduction(a, b) {
	// create submatrices and multiply them
	let Uk = numeric.getBlock(svd.U, [0, a - 1], [svd.U.length - 1, b - 1]);
	let Sk = numeric.getBlock(svd.S, [a - 1, a - 1], [b - 1, b - 1]);
	let Vk = numeric.getBlock(svd.V, [0, a - 1], [svd.V.length - 1, b - 1]);
	let M = numeric.dot(Uk, numeric.dot(Sk, numeric.transpose(Vk)));
	// create buffer for image data
	const width = canvas.width;
	const height = canvas.height;
	let buffer = new Uint8ClampedArray(width * height * 4);
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			let i = (row * (width * 4)) + (col * 4);
			let value = Math.round(M[row][col] * 255);
			buffer[i] = value;
			buffer[i + 1] = value;
			buffer[i + 2] = value;
			buffer[i + 3] = 255;
		}
	}
	// put data on canvasSVD
	let imgData = ctxSVD.createImageData(width, height);
	imgData.data.set(buffer);
	ctxSVD.putImageData(imgData, 0, 0);
	imageSVD.src = canvasSVD.toDataURL();
}

function updateInstructions() {
	let rank = svd.sValues.length;
	while (rank > 0 && svd.sValues[rank - 1] == 0) {
		rank--;
	}
	instructions.innerHTML =
	`Enter a number (e.g. 1) or range (e.g. 1-20) between 1 and ${svd.sValues.length} (inclusive). <br />
	If you enter a range, the image will be approximated using the singular values in the given range (inclusive). <br />
	If you enter a single number n, it will be interpreted as the range n-n.<br />
	Please note that values below 0 and above 1 will be clamped and displayed as black and white, respectively.`;

	rankText.innerHTML = `Rank of original matrix: ${rank}`;

	// also update table of singular values
	table.textContent = ""; // clear table
	for (let i = 0; i < rank; i++) {
		let tableRow = document.createElement("tr");
		let cellNum = document.createElement("td");
		cellNum.innerHTML = i + 1;
		let cellSVal = document.createElement("td");
		cellSVal.innerHTML = svd.sValues[i];
		tableRow.appendChild(cellNum);
		tableRow.appendChild(cellSVal);
		table.appendChild(tableRow);
	}
}

goButton.onclick = function() {
	textbox.disabled = true;
	goButton.disabled = true;
	let match = /^(\d+)$/.exec(textbox.value);
	if (match) {
		// one number
		let b = parseInt(match[1]);
		if (b <= 0) {
			alert("number given is too small");
		} else if (b > svd.sValues.length) {
			alert("number given is too large");
		} else {
			reduction(b, b);
		}
	} else {
		match = /^(\d+)-(\d+)$/.exec(textbox.value);
		if (match) {
			// number range
			let a = parseInt(match[1]);
			let b = parseInt(match[2]);
			if (a > b) {
				alert("first number cannot be larger than second number");
			} else if (a <= 0) {
				alert("left bound of range is too small");
			} else if (b > svd.sValues.length) {
				alert("right bound of range is too large");
			} else {
				reduction(a, b);
			}
		} else {
			alert("invalid number/range");
		}
	}

	textbox.disabled = false;
	goButton.disabled = false;
}
