const colorListElement = document.getElementById("color-list");
const colorBox = document.getElementById("color-box");
const mixedColorReading = document.getElementById("mixed-color-reading");
const baseColorInput = document.getElementById("base-color-input");
const baseColorReading = document.getElementById("base-color-reading");

function componentToHex(c) {
	let hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#"
		+ componentToHex(Math.round(r * 255))
		+ componentToHex(Math.round(g * 255))
		+ componentToHex(Math.round(b * 255));
}

function hexToRGB(hex) {
	let result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return {
		r: parseInt(result[1], 16) / 255,
		g: parseInt(result[2], 16) / 255,
		b: parseInt(result[3], 16) / 255
	};
}

function mixColors(colors, mixValues, baseColor) {
	let red = baseColor.r;
	let green = baseColor.g;
	let blue = baseColor.b;
	for (let i = 0; i < colors.length; i++) {
		red *= (1 - (1 - colors[i].r) * mixValues[i]);
		green *= (1 - (1 - colors[i].g) * mixValues[i]);
		blue *= (1 - (1 - colors[i].b) * mixValues[i]);
	}
	return {
		r: red,
		g: green,
		b: blue,
	};
}

function update() {
	const colorItemList = colorListElement.children;
	// read in colors and mix values from document elements
	const colors = [];
	const mixValues = [];
	for (const colorItem of colorItemList) {
		const colorPicker = colorItem.querySelector(".picker");
		colors.push(hexToRGB(colorPicker.value));
		const colorSlider = colorItem.querySelector(".slider");
		mixValues.push(colorSlider.value);
	}
	// get base color and update its readings
	const baseColor = hexToRGB(baseColorInput.value);
	baseColorReading.innerHTML = "base color: " + baseColorInput.value;
	// mix colors together and display result
	const color = mixColors(colors, mixValues, baseColor);
	const colorHex = rgbToHex(color.r, color.g, color.b)
	colorBox.style.backgroundColor = colorHex;
	mixedColorReading.innerHTML = colorHex + " (";
	// update the slider color gradients and readings
	let i = 0;
	for (const colorItem of colorItemList) {
		const colorSlider = colorItem.querySelector(".slider");
		const mixValuesLeft = [...mixValues];
		const mixValuesRight = [...mixValues];
		mixValuesLeft[i] = 0;
		mixValuesRight[i] = 1;
		const colorLeft = mixColors(colors, mixValuesLeft, baseColor);
		const colorRight = mixColors(colors, mixValuesRight, baseColor);
		colorSlider.style.background = "linear-gradient(to right, "
			+ rgbToHex(colorLeft.r, colorLeft.g, colorLeft.b) + ", "
			+ rgbToHex(colorRight.r, colorRight.g, colorRight.b) + ")";

		const colorPicker = colorItem.querySelector(".picker");
		const colorReading = colorItem.querySelector(".reading");
		const percent = Math.round(colorSlider.value*1000)/10;
		colorReading.innerHTML = `${colorPicker.value}, ${percent}%`;
		mixedColorReading.innerHTML += (i == 0 ? "" : ", ") + percent + "%";
		i++;
	}
	mixedColorReading.innerHTML += ")";
}

function addColor(colorHex) {
	let colorItem = document.createElement("div");
	colorItem.className = "color-item";

	let colorPicker = document.createElement("input");
	colorPicker.type = "color";
	colorPicker.value = colorHex;
	colorPicker.className = "picker"
	colorPicker.oninput = update;

	let colorSlider = document.createElement("input");
	colorSlider.type = "range";
	colorSlider.min = 0;
	colorSlider.max = 1;
	colorSlider.step = 0.001;
	colorSlider.value = 0;
	colorSlider.className = "slider";
	colorSlider.oninput = update;

	let colorReading = document.createElement("div");
	colorReading.className = "reading";
	colorReading.innerHTML = colorHex + ", 0%";

	let removeButton = document.createElement("button");
	removeButton.type = "button";
	removeButton.onclick = function() {
		colorItem.remove();
		update();
	}
	removeButton.innerHTML = "X";

	colorItem.appendChild(colorPicker);
	colorItem.appendChild(colorSlider);
	colorItem.appendChild(removeButton);
	colorItem.appendChild(colorReading);
	colorListElement.appendChild(colorItem);
	update();
}

addColor("#00ffff");
addColor("#ff00ff");
addColor("#ffff00");
