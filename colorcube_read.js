let colorNames = {};
let colors = [];
let nPoints = 0;

// get the csv text
// stolen from stackoverflow

let request = new XMLHttpRequest();
request.open('GET', 'colorcube_colors.csv');
request.send(null);
request.onreadystatechange = function () {
	if (request.readyState === 4 && request.status === 200) {
		readCSV(request.responseText);
		main(); // actually run the thing
	}
}

function readCSV(text) {
	// grab hex and names from csv
	//console.log(text);
	text = text.split('\n');
	//console.log(text);
	for (const line of text) {
		if (line) {
			const entries = line.split(',');
			const hexString = entries[1].toLowerCase();
			const colorNum = parseInt(hexString, 16);
			const r = (colorNum >> 16) & 0xff;
			const g = (colorNum >> 8) & 0xff;
			const b = colorNum & 0xff;
			if (hexString in colorNames) {
				colorNames[hexString] += ' <span style="color:#fff8">or</span> ' + entries[0];
			} else {
				colors.push([r / 255, g / 255, b / 255]);
				colorNames[hexString] = entries[0];
				nPoints++;
			}
		}
	}
}
