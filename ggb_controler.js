// SET PARAMETERS FOR API
var parameters = {
    "id": "ggbApi",
    "appName": "graphing",
    // "width": 70,
    "height": 500,
    "showToolBar": false,
    "borderColor": null,
    "showMenuBar": false,
    "allowStyleBar": true,
    "showAlgebraInput": true,
    "enableLabelDrags": false,
    "enableShiftDragZoom": true,
    "enableUndoRedo": false,
    "capturingThreshold": null,
    "showToolBarHelp": false,
    "errorDialogsActive": true,
    "showTutorialLink": false,
    "showLogging": false,
    "useBrowserForJS": false,
};

parameters.appletOnLoad = function(api) {

    function getNumPoints() {
        var n = 0;
        if (api.exists('A')) ++n;
        if (api.exists('B')) ++n;
        if (api.exists('C')) ++n;
        if (api.exists('D')) ++n;
        if (api.exists('E')) n = 5;
        return n;
    }

    function addListener(objName) {
        // Format segments
        if (api.getObjectType(objName) == "segment" || api.getObjectType(objName) == "line") {
            api.setLabelVisible(objName, false);
        }
        // if (api.exists('A') && api.exists('B') && !api.exists('f')) {
        //     api.evalCommand("f = Line(A,B)");
        // }
        // if (api.exists('C') && api.exists('D') && !api.exists('g')) {
        //     api.evalCommand("g = Line(C,D)");
        // }
        // When all points are placed...
        if (getNumPoints() == 4 && api.exists('g')) {
            api.setMode(0); // sets tool to "point"
            document.getElementById("Save to table").disabled = false; // Activates save button
        } else if (getNumPoints() == 5) { // If a new point is placed...
            const x = api.getXcoord(objName)
            const y = api.getYcoord(objName)
            ggbReset(api); // ... everything is cleared ...
            api.evalCommand("A = (" + x + "," + y + ")"); // ... and the point is placed as a starting point.
        }
        updateWrithe(api);
    }

    function removeListener(objName) {
        if (getNumPoints() < 4) {
            api.setMode(15); // set tool to segment
            document.getElementById("Save to table").disabled = true;
        }
        updateWrithe(api);
    }

    function updateListener(objName) {
        updateWrithe(api);
    }

    api.setMode(15); // set tool to "segment"
    // register add, remove and update listeners
    api.registerAddListener(addListener);
    api.registerRemoveListener(removeListener);
    api.registerUpdateListener(updateListener);
}

// CREATE INSTANCE OF API
var ggbApplet = new GGBApplet(parameters, true);
window.addEventListener("load", function() {
    ggbApplet.inject('ggb-element');
});

// OTHER FUNCTIONS
// Dealing with GeoGebra
function ggbReset(api) {
    var n = api.getObjectNumber();
    var names = api.getAllObjectNames();
    names.forEach(function(value) {
        api.deleteObject(value)
    });
}

// Dealing with writhe
var tableData = [
    ["writhe", "A", "B", "C", "D", "writheType", "perturbations"]
];
var currentWrithe = "---"; // "---" or a double
var A;
var B;
var C;
var D;
var writheType;
var eps;
var perturbations = [0, 0, 0, 0];

function updateWrithe(api) {
    if (api.exists('D') && api.exists('C') &&
        api.exists('B') && api.exists('A')) { // order inverted to exploit lazy eval (it's faster)
        A = [api.getXcoord('A'), api.getYcoord('A')];
        B = [api.getXcoord('B'), api.getYcoord('B')];
        C = [api.getXcoord('C'), api.getYcoord('C')];
        D = [api.getXcoord('D'), api.getYcoord('D')];

        writheType = document.getElementById("writheType").value;
        eps = parseFloat(document.getElementById("eps").value);
        const points = ['A', 'B', 'C', 'D'];
        for (var i = 0; i < 4; ++i)
            perturbations[i] = (document.getElementById(points[i]).checked ? eps : 0);

        currentWrithe = writheCalculator(A, B, C, D, writheType, perturbations);

        // Display on screen
        var prec = 4; // precision to display writhe
        document.getElementById("currentWritheStr").innerHTML = "Writhe: " + currentWrithe.toPrecision(prec) + " ";
    } else {
        currentWrithe = "---";
        document.getElementById("currentWritheStr").innerHTML = "Writhe: " + currentWrithe + " ";
    }
}

// Pre: A, B, C and D exist and writhe is calculated in currentWrithe
function saveWritheToTable() {
    // ---- Save data with full precision
    tableData.push([currentWrithe,
        [...A], // literal copy
        [...B],
        [...C],
        [...D],
        writheType,
        [...perturbations]
    ]);

    // ---- Modify Table Display
    var results = document.getElementById("resultsTable");
    var row = results.insertRow();
    row.setAttribute("class", "dataRow");

    // Insert Cells
    var buttonsCell = row.insertCell(0);
    var writheData = row.insertCell(1);
    var AData = row.insertCell(2);
    var BData = row.insertCell(3);
    var CData = row.insertCell(4);
    var DData = row.insertCell(5);
    var writheTypeTable = row.insertCell(6);
    var perturbationsTable = row.insertCell(7);

    // Add Buttons
    buttonsCell.setAttribute("class", "buttonsCell");
    var deleteButton = document.createElement("button");
    deleteButton.setAttribute("class", "deleteButton");
    deleteButton.setAttribute("onclick", "deleteTable(this)");
    buttonsCell.appendChild(deleteButton);
    var selectButton = document.createElement("button");
    selectButton.innerHTML = "select";
    selectButton.setAttribute("class", "selectButton");
    selectButton.setAttribute("onclick", "selectTable(this)");
    buttonsCell.appendChild(selectButton);

    // Insert Data
    prec = 3;
    writheData.innerHTML = currentWrithe.toPrecision(prec);
    AData.innerHTML = "(" + A[0].toPrecision(prec) + ", " + A[1].toPrecision(prec) + ")";
    BData.innerHTML = "(" + B[0].toPrecision(prec) + ", " + B[1].toPrecision(prec) + ")";
    CData.innerHTML = "(" + C[0].toPrecision(prec) + ", " + C[1].toPrecision(prec) + ")";
    DData.innerHTML = "(" + D[0].toPrecision(prec) + ", " + D[1].toPrecision(prec) + ")";
    writheTypeTable.innerHTML = writheType;
    perturbationsTable.innerHTML = "(" + perturbations.join(", ") + ")";
}

function downloadTable(tableData) {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Fill CSV
    tableData.forEach(function(rowData) {
        for (var i = 0; i < rowData.length; ++i) {
            if (rowData[i] instanceof Array) {
                if (rowData[i].length == 2) { // Dealing with an array representing a 2D point
                    rowData[i] = '"' + rowData[i].toString() + ',0"'; // to 3D
                } else { // Dealing with any other array
                    rowData[i] = '"' + rowData[i].toString() + '"';
                }
            }
        }
        var row = rowData.join(",");
        csvContent += row + "\r\n";
    });

    // Encode CSV
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "writhe_data.csv");
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "writhe_data.csv".
}

// Pre: tableRow is a <tr> element and its immediate parent is <table>
function getPositionInTable(tableRow) {
    var pos = 0;
    while (tableRow.previousSibling != null) { // tableRow is not the first
        tableRow = tableRow.previousSibling;
        if (tableRow.tagName == "TR") // Sometimes other elements get weirdly added
            ++pos;
    }
    return pos;
}

// Pre: rowDelete is a <tr> element or has a <tr> ancestor
function deleteTable(rowDelete) {
    // Find nearest row
    var row = rowDelete;
    while (row.tagName != "TR") row = row.parentElement;
    // Get pos
    var pos = getPositionInTable(row);
    // Exterminate
    tableData.splice(pos, 1);
    row.remove();
}

// Pre: rowSelect is a <tr> element or has a <tr> ancestor
function selectTable(rowSelect) {
    // Find nearest row
    var row = rowSelect;
    while (row.tagName != "TR") row = row.parentElement;
    // Get pos
    var pos = getPositionInTable(row);

    // Fill variables
    ggbReset(ggbApi);
    currentWrithe = tableData[pos][0];
    A = tableData[pos][1];
    B = tableData[pos][2];
    C = tableData[pos][3];
    D = tableData[pos][4];
    writheType = tableData[pos][5];
    perturbations = [...tableData[pos][6]];
    eps = Math.max(...perturbations);

    // Adjust parameters accordingly
    document.getElementById("writheType").value = writheType;
    document.getElementById("eps").value = eps.toString();
    const points = ['A', 'B', 'C', 'D'];
    for (var i = 0; i < 4; ++i)
        document.getElementById(points[i]).checked = (perturbations[i] == 0 ? false : true);

    // Place points
    ggbApi.evalCommand("A = (" + A[0] + "," + A[1] + ")");
    ggbApi.evalCommand("B = (" + B[0] + "," + B[1] + ")");
    ggbApi.evalCommand("f = Line(A,B)"); // For some reason "f = Segment(A,B)" doesn't work, so this is a workaround.
    ggbApi.evalCommand("C = (" + C[0] + "," + C[1] + ")");
    ggbApi.evalCommand("D = (" + D[0] + "," + D[1] + ")");
    ggbApi.evalCommand("g = Line(C,D)"); // For some reason "f = Segment(A,B)" doesn't work, so this is a workaround.
}

// Should only be used for CSVs generated by this applet!!
function readCSV(input) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        var results = csvToArray(text);
        for (const res of results) {
            currentWrithe = res.writhe;
            A = res.A;
            B = res.B;
            C = res.C;
            D = res.D;
            writheType = res.writheType;
            perturbations = res.perturbations;
            eps = Math.max(...perturbations);
            saveWritheToTable();
        }
    };
    var csv = input.files[0];
    reader.readAsText(csv);
}

// Should only be used for CSVs generated by this applet!!
function csvToArray(str, delimiter = ",") {
    // slice from start of text to the first \n index
    // use split to create an array from string by delimiter
    const headers = str.slice(0, str.indexOf("\r\n")).split(delimiter);

    // slice from \n index + 1 to the end of the text
    // use split to create an array of each csv value row
    const rows = str.slice(str.indexOf("\n") + 1).split("\r\n");

    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = [];
    for (var row of rows) {
        const splitRow = row.split(delimiter);
        var values = [];
        for (var i = 0; i < splitRow.length; ++i) {
            var elem = splitRow[i];
            if (!isNaN(parseFloat(elem))) values.push(parseFloat(elem));
            else if (elem.startsWith('"')) { // parse array
                elem = elem.replace('"', '');
                var val = [parseFloat(elem)];
                ++i;
                elem = splitRow[i];
                while (!(elem.endsWith('"') || elem.endsWith('"\r'))) {
                    val.push(parseFloat(elem));
                    ++i;
                    elem = splitRow[i];
                }
                elem = elem.replace('"', '');
                val.push(parseFloat(elem));
                values.push(val);
            } else values.push(elem);
        }
        if (values.length == headers.length) {
            const el = headers.reduce(function(object, header, index) {
                object[header] = values[index];
                return object;
            }, {});
            arr.push(el);
        }
    }

    // return the array
    return arr;
}