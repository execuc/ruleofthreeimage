function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function lineLength(line) {
    return distance(line.x1, line.y1, line.x2, line.y2);
}

function lineBoundingboxDimension(line) {
    return {
        width: Math.abs(line.x1 - line.x2),
        height: Math.abs(line.y1 - line.y2)
    };
}

function lineCenter(line) {
    return {
        x: (line.x1 + line.x2) / 2.0,
        y: (line.y1 + line.y2) / 2.0
    };
}

function getClickButton(event) {
    var button;
    switch (event.which) {
        case 1:
            button = "Left";
            break;
        case 2:
            button = "Middle";
            break;
        case 3:
            button = "Right";
            break;
        default:
            button = "None";
    }
    return button;
}