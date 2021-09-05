// SET PARAMETERS FOR API
var parameters = {
    "id": "ggbApi",
    "appName": "graphing",
    "width": 748,
    "height": 500,
    "showToolBar": false,
    "borderColor": null,
    "showMenuBar": false,
    "allowStyleBar": true,
    "showAlgebraInput": false,
    "enableLabelDrags": false,
    "enableShiftDragZoom": true,
    "enableUndoRedo": false,
    "capturingThreshold": null,
    "showToolBarHelp": false,
    "errorDialogsActive": true,
    "showTutorialLink": false,
    "showLogging": false,
    "useBrowserForJS": false
};

parameters.appletOnLoad = function(api) {

    function addListener(objName) {
        // Format segments
        if (api.getObjectType(objName) == "segment") {
            api.setLabelVisible(objName, false);
        }
        // When all points are placed...
        if (api.getObjectNumber() == 6) {
            api.setMode(1); // sets tool to "point"
            document.getElementById("Save to table").disabled = false; // Activates save button
        } else if (api.getObjectNumber() == 7) { // If a new point is placed...
            const x = api.getXcoord(objName)
            const y = api.getYcoord(objName)
            ggbReset(api); // ... everything is cleared ...
            api.evalCommand("A = (" + x + "," + y + ")"); // ... and the point is placed as a starting point.
        }
        updateWrithe(api);
    }

    function removeListener(objName) {
        if (api.getObjectNumber() < 5) {
            api.setMode(15);
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
    ["writhe", "A", "B", "C", "D", "writheType", "perturbation size", "points perturbated"]
];
var currentWrithe = "---"; // "---" or a double
var A;
var B;
var C;
var D;
var writheType;
var eps;
var perturbated;

function updateWrithe(api) {
    if (api.exists('D') && api.exists('C') &&
        api.exists('B') && api.exists('A')) { // order inverted to exploit lazy eval (it's faster)
        A = [api.getXcoord('A'), api.getYcoord('A')];
        B = [api.getXcoord('B'), api.getYcoord('B')];
        C = [api.getXcoord('C'), api.getYcoord('C')];
        D = [api.getXcoord('D'), api.getYcoord('D')];

        writheType = document.getElementById("writheType").value;
        eps = parseFloat(document.getElementById("eps").value);
        perturbated = [];
        for (var p of ['A', 'B', 'C', 'D'])
            if (document.getElementById(p).checked) perturbated.push(p);
        perturbations = {
            'A': 0,
            'B': 0,
            'C': 0,
            'D': 0,
        };
        for (var p of perturbated) perturbations[p] += eps;

        currentWrithe = writheCalculator(A, B, C, D, writheType, perturbations);

        // Display on screen
        var prec = 4; // precision to display writhe
        document.getElementById("currentWritheStr").innerHTML = "writhe: " + currentWrithe.toPrecision(prec) + " ";
    } else {
        currentWrithe = "---";
        document.getElementById("currentWritheStr").innerHTML = "writhe: " + currentWrithe + " ";
    }
}

// Pre: A, B, C and D exist and writhe is calculated in currentWrithe
function saveWritheToTable() {
    // Save data with full precision
    tableData.push([currentWrithe, A, B, C, D, writheType, eps, perturbated]);

    // Insert data to Table with reduced precision
    var results = document.getElementById("results");
    var row = results.insertRow();
    var writheData = row.insertCell(0);
    var AData = row.insertCell(1);
    var BData = row.insertCell(2);
    var CData = row.insertCell(3);
    var DData = row.insertCell(4);

    prec = 3;
    writheData.innerHTML = currentWrithe.toPrecision(prec);
    AData.innerHTML = "(" + A[0].toPrecision(prec) + ", " + A[1].toPrecision(prec) + ")";
    BData.innerHTML = "(" + B[0].toPrecision(prec) + ", " + B[1].toPrecision(prec) + ")";
    CData.innerHTML = "(" + C[0].toPrecision(prec) + ", " + C[1].toPrecision(prec) + ")";
    DData.innerHTML = "(" + D[0].toPrecision(prec) + ", " + D[1].toPrecision(prec) + ")";
}

function downloadTable(tableData) {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Fill CSV
    tableData.forEach(function(rowData) {
        for (var i = 0; i < rowData.length; ++i) {
            if (rowData[i] instanceof Array) {
                if (typeof rowData[i][0] == 'number') {
                    rowData[i] = '"' + rowData[i].toString() + ',0"';
                } else rowData[i] = '"' + rowData[i].toString() + '"';
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