function imageLoadCallback(load) {
    if (load == true) {
        lock_input();
    } else {
        delock_input();
    }

}

function firstLineCallback(line) {
    if(isNaN(parseFloat($("#unit_val").val().replace(',', '.'))))
    {
        $("#unit_val").addClass("red_border");
    }
}

var callbacks = {
    imageLoad: imageLoadCallback,
    firstLine: firstLineCallback
};
var canvasImage = new LineImageCanvas($("#canvas"), callbacks);

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    var file = files[0];
    if (!file.type.match('image.*')) {
        return;
    }
    canvasImage.loadNewImage(file);
}

function handleUrlSelect() {
    $("#url").val($("#url").val().replace("http://http://", "http://"));
    canvasImage.loadNewImageUrl($("#url").val());
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
document.getElementById('unit_val').addEventListener('keyup', paramChanged, false);
document.getElementById('opacity_val').addEventListener('change', paramChanged, false);
document.getElementById('font_val').addEventListener('change', paramChanged, false);
document.getElementById('color_picker').addEventListener('change', paramChanged, false);

var lastDownTarget;
document.addEventListener('mousedown', function(event) {
    lastDownTarget = event.target;
}, false);

document.addEventListener('keydown', function(event) {
    if (lastDownTarget == document.getElementById("canvas")) {
        if (event.keyCode == 46) {
            canvasImage.suppressCurrentLine();
        }
    }
}, false);


function paramChanged() {
    var opacity = parseFloat($("#opacity_val").val(), 10) / 100.;
    var fontHeight = parseInt($("#font_val").val(), 10);
    var unitLength = parseFloat($("#unit_val").val().replace(',', '.'));
    var lineColor = $("#color_picker").val();
    var isComma = true;
    if($("#unit_val").val().indexOf('.') !== -1)
        isComma = false;

    $("#show_opacity").text($("#opacity_val").val());
    $("#show_font_size").text($("#font_val").val());

    canvasImage.updateParameters({
        opacity: opacity,
        fontHeight: fontHeight,
        lineColor: lineColor,
        unitLength: unitLength,
        isCommaSeparator: isComma
    });

    $("#unit_val").removeClass("red_border");
}

function lock_input() {
    $('#file_button').off('click');
    $('#url_button').off('click');
}

function delock_input() {
    $('#file_button').click(function() {
        $("#files").trigger('click');
    })


    $('#url_button').click(function() {
        $('#file_val').text("");
        handleUrlSelect();
    })
}


$(function() {
    paramChanged();
    delock_input();
    canvasImage.clear();
    canvasImage.draw();
    $(window).resize(function() {
        canvasImage.onResize();
    })
})