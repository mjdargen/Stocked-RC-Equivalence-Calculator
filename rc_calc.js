/* --------------------------------------------------------------- */
/*                   r/c calculator scripting                      */
/* ----------------------------------------------------------------*/
var closest_val; // closest value so far
var closest_diff = 1000000.00; // diff of val and target
var closest = []; // array detailing values of components
var ser_par_config = []; // array detailing serial/parallel

var outputStr = "";

function calculatorClick() {
	// clear out global values for each new click
	closest_val = 0;
	closest_diff = 1000000.00;
	closest = [];
	ser_par_config = [];

	var resultDisplay = document.getElementById("resultRow");
	var exampleDisplay = document.getElementById("exampleRow");
	var calcOutput = document.getElementById("calcOutput");
	var targetTextObj = document.getElementById('targetText');
	var numCompTextObj = document.getElementById('numCompText');
	var compValsTextObj = document.getElementById('compValsText');
	var target = parseInt(targetTextObj.value);
	var numComp = parseInt(numCompTextObj.value);
	var compValsStr = compValsTextObj.value;

	var compVals = [];
	compVals[0] = "";
	var i = 0;

	while (compValsStr.indexOf(",") != -1) {
		var comma = compValsStr.indexOf(",");
		var newInt = parseInt(compValsStr.substring(0,comma));
		compValsStr = compValsStr.substring(comma+1,compValsStr.length);
		compVals[i] = newInt;
		i++;
	}
	compVals[i] = parseInt(compValsStr);
	if (document.getElementById("resRadio").checked) {
		resistor(target, numComp, compVals);
	}
	else if (document.getElementById("capRadio").checked) {
		capacitor(target, numComp, compVals);
	}

	calcOutput.innerHTML = outputStr;
	resultDisplay.style.display = "block";
	exampleDisplay.style.display = "flex";
}

/*
Retrieves and prints the best resistor configuration
	* target - target resistance value
	* numComp - total number of resistors allowed to be used to achieve target val
	* compVals - array of resistor values
*/
function resistor(target, numComp, compVals) {
	// length of resistance values
	var num_res = compVals.length;

	// run through all possible number of components
	for (var i=1; i<=numComp; i++) {
		var data = [];
		resCombination(compVals, num_res, i, 0, data, target);
	}

	var units = document.getElementById("selected_unit").value;

	// print results
	outputStr = "Closest Value: " + closest_val.toFixed(3) + " " + units + " <br>";
	outputStr += "Difference: " + closest_diff.toFixed(3) + " " + units + " <br>";
	outputStr += "Resistor Configuration: ";
	for (var i=0; i<numComp; i++) {
		if (i<closest.length) {
			outputStr += "R" + i + "=" + closest[i] + " " + units + " ";
			if (i+1<closest.length) {
				if (ser_par_config[i+1]) outputStr += "|| ";
				else outputStr += "+ ";
			}
		}
		else break;
	}
}

/*
Calculates the best combination of resistors to achieve a target value.
	* res[] - input array of resistor values
	* num_res	- size of input array of resistor values
	* num_comb	- number of resistors allowed
	* index - index of comb[]
	* comb[] - array of current combination
	* target - the target value
	* No return value - passes current best combination to global values
*/
function resCombination(res, num_res, num_comb, index, comb, target) {
	// current combination is complete
	if (index == num_comb) {
		var ser_par_size = Math.pow(2,num_comb); // 2^(number of components)
		var ser_par = []; // bool array specifying serial or parallel for each component
		var calc; // calculated equivalent resistance value

		// step through every possible series/parallel config of current combination
		for (var j=0; j<ser_par_size; j++) {
			calc = 0.0;
			// creates a boolean array of 0s & 1s for all possible combinations
			for (var k=0; k<num_comb; k++) {
				ser_par[k] = (j >> k) & 1;
			}
			// do the calculations for the combination based on series/parallel combo
			for (var k=0; k<num_comb; k++) {
				// first number, just add
				if (k==0) calc = comb[k];
				// zero means series, add resistance values
				else if (!ser_par[k]) calc += comb[k];
				// one means parallel, inverse of the sum of reciprocals
				else if (ser_par[k]) calc = (calc*comb[k])/(calc+comb[k]);
			}

			// check to see if difference is less than previous best
			if (Math.abs(calc - target) < closest_diff) {
				// it is less, so update global values
				closest_val = calc;
				closest_diff = Math.abs(calc - target);
				// clear to zero
				for (var k=0; k<num_comb; k++) {
					closest[k] = 0;
				}
				// update closest value & series/parallel arrays
				for (var k=0; k<num_comb; k++) {
					closest[k] = comb[k];
					ser_par_config[k] = ser_par[k];
				}
			}
		}
		return 0;
	}

	// recursively call and replace the index with all possible values
	for (var i=0; i<=num_res && num_res-i+1 >= num_comb-index; i++) {
		comb[index] = res[i];
		resCombination(res, num_res, num_comb, index+1, comb, target);
	}
}

/*
Retrieves and prints the best capacitor configuration
	* target - target capacitance value
	* numComp - total number of capacitors allowed to be used to achieve target val
	* compVals - array of capacitor values
*/
function capacitor(target, numComp, compVals) {
	// length of capacitance values
	var num_cap = compVals.length;

	// run through all possible number of components
	for (var i=1; i<=numComp; i++) {
		var data = [];
		capCombination(compVals, num_cap, i, 0, data, target);
	}

	var units = document.getElementById("selected_unit").value;

	// print results
	outputStr = "Closest Value: " + closest_val.toFixed(3) + " " + units + " <br>";
	outputStr += "Difference: " + closest_diff.toFixed(3) + " " + units + " <br>";
	outputStr += "Capacitor Configuration: ";
	for (var i=0; i<numComp; i++) {
		if (i<closest.length) {
			outputStr += "C" + i + "=" + closest[i] + " " + units + " ";
			if (i+1<closest.length) {
				if (ser_par_config[i+1]) outputStr += "|| ";
				else outputStr += "+ ";
			}
		}
		else break;
	}
}

/*
Calculates the best combination of capacitors to achieve a target value.
	* cap[] - input array of capacitor values
	* num_cap	- size of input array of capacitor values
	* num_comb	- number of capacitors allowed
	* index - index of comb[]
	* comb[] - array of current combination
	* target - the target value
	* No return value - passes current best combination to global values
*/
function capCombination(cap, num_cap, num_comb, index, comb, target) {
	// current combination is complete
	if (index == num_comb) {
		var ser_par_size = Math.pow(2,num_comb); // 2^(number of components)
		var ser_par = []; // bool array specifying serial or parallel for each component
		var calc; // calculated equivalent capacitance value

		// step through every possible series/parallel config of current combination
		for (var j=0; j<ser_par_size; j++) {
			calc = 0.0;
			// creates a boolean array of 0s & 1s for all possible combinations
			for (var k=0; k<num_comb; k++) {
				ser_par[k] = (j >> k) & 1;
			}
			// do the calculations for the combination based on series/parallel combo
			for (var k=0; k<num_comb; k++) {
				// first number, just add
				if (k==0) calc = comb[k];
				// zero means series, inverse of the sum of reciprocals
				else if (!ser_par[k]) calc = (calc*comb[k])/(calc+comb[k]);
				// one means parallel, add capacitance values
				else if (ser_par[k]) calc += comb[k];
			}

			// check to see if difference is less than previous best
			if (Math.abs(calc - target) < closest_diff) {
				// it is less, so update global values
				closest_val = calc;
				closest_diff = Math.abs(calc - target);
				// clear to zero
				for (var k=0; k<num_comb; k++) {
					closest[k] = 0;
				}
				// update closest value & series/parallel arrays
				for (var k=0; k<num_comb; k++) {
					closest[k] = comb[k];
					ser_par_config[k] = ser_par[k];
				}
			}
		}
		return 0;
	}

	// recursively call and replace the index with all possible values
	for (var i=0; i<=num_cap && num_cap-i+1 >= num_comb-index; i++) {
		comb[index] = cap[i];
		capCombination(cap, num_cap, num_comb, index+1, comb, target);
	}
}
