class Point {
    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    minus(p) {
        return new Point(this.x - p.x, this.y - p.y, this.z - p.z);
    }

    dot(p) {
        return this.x * p.x + this.y * p.y + this.z * p.z;
    }

    cross(p) {
        var x = this.y * p.z - this.z * p.y;
        var y = this.z * p.x - this.x * p.z;
        var z = this.x * p.y - this.y * p.x;
        return new Point(x, y, z);
    }

    divideBy(d) {
        this.x = this.x / d;
        this.y = this.y / d;
        this.z = this.z / d;
    }
}

function writheCalculator(Acoords, Bcoords, Ccoords, Dcoords, writheType, perturbations) {
    var A = new Point(Acoords[0], Acoords[1]);
    var B = new Point(Bcoords[0], Bcoords[1]);
    var C = new Point(Ccoords[0], Ccoords[1]);
    var D = new Point(Dcoords[0], Dcoords[1]);

    A.z = A.z + perturbations["A"];
    B.z = B.z + perturbations["B"];
    C.z = C.z + perturbations["C"];
    D.z = D.z + perturbations["D"];

    var AB = B.minus(A);
    var AC = C.minus(A);
    var AD = D.minus(A);
    var BC = C.minus(B);
    var BD = D.minus(B);
    var CD = D.minus(C);

    var sign = Math.sign(AC.dot(CD.cross(AB)));

    // normales
    var N1 = AC.cross(AD);
    N1.divideBy(N1.mag);
    var N2 = AD.cross(BD);
    N2.divideBy(N2.mag);
    var N3 = BD.cross(BC);
    N3.divideBy(N3.mag);
    var N4 = BC.cross(AC);
    N4.divideBy(N4.mag);

    var prec = 13;
    var sum = Math.asin(N1.dot(N2).toFixed(prec)) + Math.asin(N2.dot(N3).toFixed(prec)) +
        Math.asin(N3.dot(N4).toFixed(prec)) + Math.asin(N4.dot(N1).toFixed(prec));

    // result
    var gli = 0;
    if (writheType == "derivada") {
        var epsilon = Math.max(Math.abs(perturbations["A"]), Math.abs(perturbations["B"]),
            Math.abs(perturbations["C"]), Math.abs(perturbations["D"]));
        gli = sign * sum / (epsilon * 4 * Math.PI);
    } else if (writheType == "volum") {
        var V = Math.abs(AD.dot(BD.cross(CD))) / 6;
        gli = (sign * sum) / (V * 4 * Math.PI);
    }

    return gli;
}