/*
	This is only designed to parse HTML from a very specific webpage
	http://www.ub-air.info/ub-air/laq/average-30min.html
	and return the values as a JSON object. The code is really a hack to 
	provide an API for accessing the data and is closely tied to the page layout... 
	which means it's very possible it'll break very easily!
*/
function parse(html) {
	var responseObj = { };
	var resultsObj = { };
	responseObj.results = resultsObj;
	
	var startLoc = html.indexOf("<p><H4>");
	var endLoc = html.indexOf("</p>", startLoc);
	var tableData = html.substring(startLoc, endLoc);
	
	// Get the title string
	var titleString = tableData.substring(tableData.indexOf("<H4>") + 4, tableData.indexOf("</H4>"));
	resultsObj.startDate = titleString.substring(titleString.indexOf("2"), titleString.indexOf(" - "));
	resultsObj.endDate = titleString.substr(titleString.indexOf(" - ") + 3, 19);
	
	// Get the column titles
	resultsObj.properties = getColumnNames(tableData);
	
	// Get the units
	resultsObj.units = getUnits(tableData);
	
	// Get the stations
	resultsObj.stations = getStations(tableData);
	
	// Return as JSON
	return JSON.stringify(responseObj);
}

function getColumnNames(tableData) {
	var names = [];
	var propertyString = tableData.substring(tableData.indexOf("<TR>"), tableData.indexOf("</TR>"));
	var string = "";
	var keepGoing = true;
	var startLoc = propertyString.indexOf("<TH>");
	var endLoc = propertyString.indexOf("</TH>");
	// Because the first property is nothing, skip over it
	startLoc = propertyString.indexOf("<TH>", endLoc);
	endLoc = propertyString.indexOf("</TH>", startLoc);
	while (keepGoing) {
		string = propertyString.substring(startLoc + 4, endLoc);
		names.push(string);
		startLoc = propertyString.indexOf("<TH>", endLoc);
		endLoc = propertyString.indexOf("</TH>", startLoc);
		if (startLoc == -1) {
			keepGoing = false;
		}
	}
	return names;
}

function getUnits(tableData) {
	var names = [];
	var loc1 = tableData.indexOf("<TR>");
	var loc2 = tableData.indexOf("</TR>");
	loc1 = tableData.indexOf("<TR>", loc2);
	loc2 = tableData.indexOf("</TR>", loc1);
	var propertyString = tableData.substring(loc1, loc2);
	var string = "";
	var keepGoing = true;
	var startLoc = propertyString.indexOf("<TH>");
	var endLoc = propertyString.indexOf("</TH>");
	while (keepGoing) {
		string = propertyString.substring(startLoc + 4, endLoc);
		names.push(string);
		startLoc = propertyString.indexOf("<TH>", endLoc);
		endLoc = propertyString.indexOf("</TH>", startLoc);
		if (startLoc == -1) {
			keepGoing = false;
		}
	}
	return names;
}

function getStations(tableData) {
	var stations = [];
	
	// Skip ahead a few rows to the values we want
	var rowLoc1 = tableData.indexOf("<TR>");
	var rowLoc2 = tableData.indexOf("</TR>");
	rowLoc1 = tableData.indexOf("<TR>", rowLoc2);
	rowLoc2 = tableData.indexOf("</TR>", rowLoc1);	
	rowLoc1 = tableData.indexOf("<TR>", rowLoc2);
	rowLoc2 = tableData.indexOf("</TR>", rowLoc1);	
	
	// Loop over the stations building up a station object until we have no more
	var moreStations = true;
	while (moreStations) {
		var values = [];
		var station = { };

		var propertyString = tableData.substring(rowLoc1, rowLoc2);
		var string = "";
		var keepGoing = true;
		var startLoc = propertyString.indexOf("<TD");
		var endLoc = propertyString.indexOf("</TD>");
		startLoc = propertyString.indexOf("<TD", endLoc);
		endLoc = propertyString.indexOf("</TD>", startLoc);
		station.name = propertyString.substring(startLoc + 4, endLoc);
		startLoc = propertyString.indexOf("<TD", endLoc);
		endLoc = propertyString.indexOf("</TD>", startLoc);	
		// Keep reading data cells until we have no more
		while (keepGoing) {
			// If there is a number, it's got a class so the string lengths are different
			if (propertyString.substr(startLoc, 9) == "<TD class") {
				string = propertyString.substring(startLoc + 24, endLoc);
			} else {
				string = propertyString.substring(startLoc + 4, endLoc);
			}
			
			values.push(parseFloat(string));
			startLoc = propertyString.indexOf("<TD", endLoc);
			endLoc = propertyString.indexOf("</TD>", startLoc);
			if (startLoc == -1) {
				keepGoing = false;
			}
		}
		station.values = values;
		stations.push(station);
		
		// Move on to the next row
		rowLoc1 = tableData.indexOf("<TR>", rowLoc2);
		rowLoc2 = tableData.indexOf("</TR>", rowLoc1);
		if (rowLoc1 == -1) {
			moreStations = false;
		}		
	}
	return stations;
}

exports.parse = parse;