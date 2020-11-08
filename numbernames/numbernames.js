const units = [
	'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'
];
const teens = [
	'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
];
const tens = [
	'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];
// for creating -illions
const illionStandard = [
	'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion',
	'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion',
	'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion', 'quindecillion',
	'sexdecillion', 'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion'
];
const illionUnits = ['', 'un', 'duo', 'tre', 'quattuor', 'quinqua', 'se', 'septe', 'octo', 'nove'];
const illionTens = ['', 'deci', 'viginti', 'triginta', 'quadraginta', 'quinquaginta', 'sexaginta', 'septuaginta', 'octoginta', 'nonaginta'];
const illionHundreds = ['', 'centi', 'ducenti', 'trecenti', 'quadringenti', 'quingenti', 'sescenti', 'septingenti', 'octingenti', 'nongenti'];

// construct list of base 10 digits of num
function createBase10(num) {
	let base10 = [0, 0, 0];
	let i = 0;
	while (num) {
		base10[i] = num % 10;
		num = Math.floor(num / 10);
		i++;
	}
	return base10;
}

// given 0 < n < 1000, create the appropriate prefix for an -illion
function illionPrefix(n) {
	let base10 = createBase10(n);
	// some prefix modifications:
	// m/n added to septe/nove
	let addon;
	if (base10[0] == 7 || base10[0] == 9) {
		if (
			base10[1] == 2 ||
			base10[1] == 8 ||
			(base10[1] == 0 && base10[2] == 8)
		) {
			addon = "m";
		} else if (
			base10[1] == 9 ||
			(base10[1] == 0 && base10[2] == 9)
		) {
			addon = "";
		} else {
			addon = "n";
		}
	}
	// s(/x) added to tre/se
	else if (base10[0] == 3 || base10[0] == 6) {
		if (
			(base10[1] >= 2 && base10[1] <= 5) ||
			(base10[1] == 0 && (base10[2] >= 3 && base10[2] <= 5))
		) {
			addon = "s";
		} else if (
			base10[1] == 8 ||
			(base10[1] == 0 && (base10[2] == 1 || base10[2] == 8))
		) {
			addon = (base10[0] == 6) ? "x" : "s";
		} else {
			addon = "";
		}
	} else {
		addon = "";
	}
	return illionUnits[base10[0]] + addon + illionTens[base10[1]] + illionHundreds[base10[2]];
}

// given bigInt n >= 0, return the nth -illion
function illion(n) {
	if (n.leq(20)) { // use standard dictionary words
		return illionStandard[n.toJSNumber()];
	} else if (n < 1000) { // ue conway & guy's latin notation
		let pfx = illionPrefix(n.toJSNumber());
		if ("aeiou".includes(pfx[pfx.length - 1])) {
			pfx = pfx.slice(0, -1);
		}
		return pfx + "illion";
	} // otherwise, use conway & guy's notation extended with "illi"s
	let base1000 = [];
	while (!(n.isZero())) {
		base1000.unshift(n.mod(1000));
		n = n.divide(1000);
	}
	let name = "";
	for (const d of base1000) {
		if (d.isZero()) {
			if (name[name.length - 1] == "i") {
				name += "lli";
			} else {
				name += "illi";
			}
		} else {
			name += illion(d).slice(0, -2);
		}
	}
	name += "on";
	return name;
}

function name1000(num) {
	let base10 = createBase10(num);
	let name = "";
	if (base10[2] != 0) {
		name += `${units[base10[2] - 1]} hundred `;
	}
	if (base10[1] != 0) {
		if (base10[1] == 1) {
			name += `${teens[base10[0]]} `;
		} else {
			name += `${tens[base10[1] - 2]} `;
		}
	}
	if (base10[0] != 0 && base10[1] != 1) {
		name += `${units[base10[0] - 1]} `
	}
	return name.slice(0, -1);
}

function getName(numStr, numericize) {
	let base1000 = [];
	let isNegative = false;
	let name = "";
	if (numStr[0] == "-") {
		isNegative = true;
		numStr = numStr.slice(1);
	}
	// construct array of coeffs for base 1000 expansion
	for (let end = numStr.length; end > 0; end -= 3) {
		const start = (end < 3) ? 0 : (end - 3);
		base1000.push(parseInt(numStr.slice(start, end)));
	}
	//console.log(base1000);
	for (let i = 0; i < base1000.length; i++) {
		const dig = numericize ? base1000[i] : name1000(base1000[i]);
		if (dig != 0) {
			if (i == 0) {

				name = dig + name;
			} else {
				name = `${dig} ${illion(bigInt(i - 1))} ` + name;
			}
		}
	}
	if (!name) {
		name = numericize ? "0" : "zero";
	}
	if (isNegative) {
		name = "negative " + name;
	}
	return name;
}

function displayName() {
	const numStr = document.getElementById("num").value;
	const numericize = document.getElementById("numericize").checked;
	let name;
	if (numStr.match(/^-?\d+$/)) {
		name = getName(numStr, numericize);
	} else {
		name = "invalid input";
	}
	document.getElementById("name").innerHTML = name;
}

function displayIllion() {
	const numStr = document.getElementById("num").value;
	let name;
	if (numStr.match(/^\d+$/)) {
		name = illion(bigInt(numStr));
	} else {
		name = "invalid input";
	}
	document.getElementById("name").innerHTML = name;
}
