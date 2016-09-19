class LineImageCanvas {
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.parent = this.canvas.parent();
        this.ctx = this.canvas[0].getContext('2d');
        this.image = null;
        this.imageLoaded = false;
        this.filename = null;
        this.isFilename = false;
        this.min_border = {
            x: 10,
            y: 10
        };
        this.callbacks = callbacks;
        this.state = "None";
        this.lines = [];
        this.current_line = -1;
        this.parameters = {};
        this.lastClickPosition = {
            x: 0,
            y: 0
        };
        this.transformation = new Transformation(this);
        this.onResize();
        this.draw();
        this.bindEvent();
    }

    bindEvent() {
        this.canvas[0].addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.canvas[0].addEventListener('mouseup', this.onMouseUp.bind(this), false);
        this.canvas[0].addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.canvas[0].addEventListener('mouseout', this.onMouseOut.bind(this), false);
        this.canvas[0].addEventListener('wheel', this.onWheel.bind(this), false);
    }

    onWheel(event) {
        this.transformation.setZoom(event.deltaY, event.layerX, event.layerY);
        this.draw();

    }
    onMouseDown(event) {
        if (this.imageLoaded == false)
            return;

        if (this.state != "None") {
            this.lines.splice(-1, 1);
            this.state = "None";
            this.draw();
            return;
        }
        var button = getClickButton(event);
        if (button == "Left") {
            this.state = "Select";
            var real_coord = this.transformation.getLocalCoordinatesFromEvent(event.layerX, event.layerY);
            this.lines.push({
                x1: real_coord.x,
                y1: real_coord.y,
                x2: real_coord.x,
                y2: real_coord.y
            });
        } else if (button == "Middle") {
            var click_x = event.layerX;
            var click_y = event.layerY;

            var linesNb = this.lines.length;
            var minDistance = 999999999999999999999999;
            this.current_line = -1;
            for (var index = 0; index < linesNb; index++) {
                var line = this.transformation.getRealCoordinates(this.lines[index]);
                var distance_first = distance(click_x, click_y, line.x1, line.y1);
                var distance_second = distance(click_x, click_y, line.x2, line.y2);

                if (distance_first < 5) {
                    if (distance_first < minDistance) {
                        this.current_line = index;
                        this.state = "Middle_Start";
                        minDistance = distance_first;
                    }
                }

                if (distance_second < 5) {
                    if (distance_second < minDistance) {
                        this.current_line = index;
                        this.state = "Middle_End";
                        minDistance = distance_second;
                    }

                }

            }
            if (this.current_line == -1) {
                this.state = "Move";
                this.lastClickPosition = {
                    x: event.layerX,
                    y: event.layerY
                };
            }
            this.draw();
        }
    }

    onMouseMove(event) {
        if (this.state == "Select") {
            this.updateLineEndPoint(this.lines.length - 1, event);
            this.draw();
        } else if (this.state == "Middle_Start") {
            this.updateLineStartPoint(this.current_line, event);
            this.draw();
        } else if (this.state == "Middle_End") {
            this.updateLineEndPoint(this.current_line, event);
            this.draw();
        } else if (this.state == "Move") {
            this.transformation.setTranslate(this.lastClickPosition.x - event.layerX, this.lastClickPosition.y - event.layerY)
            this.lastClickPosition = {
                x: event.layerX,
                y: event.layerY
            };
            this.draw();
        }
    }

    onMouseOut() {
        if (this.state == "Move") {
            this.state = "None";
        } else if (this.state == "Middle_Start") {
            this.state = "None";
        } else if (this.state == "Middle_End") {
            this.state = "None";
        }
    }


    onMouseUp(event) {
        if (this.state == "Select") {
            var lastIndex = this.lines.length - 1;
            this.updateLineEndPoint(lastIndex, event);
            var line = this.transformation.getRealCoordinates(this.lines[lastIndex]);
            if (distance(line.x1, line.y1, line.x2, line.y2) < 5) {
                this.lines.splice(lastIndex, 1);
            }
            this.state = "None";
            this.draw();

            if (this.lines.length == 1) {
                this.callbacks.firstLine(this.lines[0]);
            }
        } else if (this.state == "Middle_Start") {
            this.updateLineStartPoint(this.current_line, event);
            this.state = "None";
            this.draw();
        } else if (this.state == "Middle_End") {
            this.updateLineEndPoint(this.current_line, event);
            this.state = "None";
            this.draw();
        } else if (this.state == "Move") {
            this.state = "None";
        }
    }


    updateLineEndPoint(index, event) {
        var real_coord = this.transformation.getLocalCoordinatesFromEvent(event.layerX, event.layerY);
        this.lines[index].x2 = real_coord.x;
        this.lines[index].y2 = real_coord.y;
    }

    updateLineStartPoint(index, event) {
        var real_coord = this.transformation.getLocalCoordinatesFromEvent(event.layerX, event.layerY);
        this.lines[index].x1 = real_coord.x;
        this.lines[index].y1 = real_coord.y;
    }

    onResize() {
        var height =  $( window ).height() - this.parent.offset().top;
        this.canvas.attr("width", this.parent.width());
        this.canvas.attr("height", height);
        this.transformation.update();
        this.clear();
        this.draw();
    }

    clear() {
        var grd=this.ctx.createLinearGradient(0,0,this.canvas.attr("width"),0);
        grd.addColorStop(0,"#DDDDDD");
        grd.addColorStop(1,"#AAAAAA");
        this.ctx.fillStyle=grd;
        this.ctx.fillRect(0, 0, this.canvas.attr("width"), this.canvas.attr("height"));
    }

    loadNewImage(filename) {
        this.filename = filename;
        this.isFilename = true;
        this.resetLocalParameters()
        this.transformation.reset();
        this.draw();
    }

    loadNewImageUrl(url) {
        this.filename = url;
        this.isFilename = false;
        this.resetLocalParameters()
        this.draw();
    }

    resetLocalParameters()
    {
        this.imageLoaded = false;
        this.lines = [];
        this.current_line = -1;
        this.transformation.reset();
    }

    updateParameters(parameters) {
        this.parameters = parameters;
        this.draw();
    }

    draw() {
        if (this.filename != null && this.imageLoaded == false) {
            this.image = new Image();
            //this.image.crossOrigin="anonymous";
            this.image.onload = this.imageisLoaded.bind(this);
            this.image.onerror = this.imageError.bind(this);
            if (this.isFilename == true) {
                this.image.src = URL.createObjectURL(this.filename);
            } else {
                this.image.src = this.filename;
            }
            this.callbacks.imageLoad(true);

        } else if (this.imageLoaded == true) {
            this.clear();
            this.drawImage();
            this.drawLines();
        } else {
            this.drawNotice();
        }
    }

    imageisLoaded() {
        this.imageLoaded = true;
        this.transformation.update();
        this.draw();
        this.callbacks.imageLoad(false);
    }

    imageError() {
        this.callbacks.imageLoad(false);
        this.drawErrorFile();
    }

    drawErrorFile(){
        this.clear();
        this.ctx.font = "20px Calibri";
        this.ctx.fillStyle = "#FF0000";
        this.ctx.fillText("Error: Unable to open image file.", 10, 30);
    }

    drawNotice(){
        this.clear();
        this.ctx.font = "20px Calibri";
        this.ctx.fillStyle = "#333333";
        this.ctx.fillText("Load an image from url or disk.", 10, 40);
        this.ctx.fillText("With left click, draw yout first line and specify its length in your unity from \"Unit Length\" input.", 10, 80);
        this.ctx.fillText("Length will be computed and displayed for the others.", 10, 120);
        this.ctx.fillText("Line could be moved clicking on their point with middle button.", 10, 160);
        this.ctx.fillText("Move an existing line leads to select it and it could be delete by pressing \"suppress\" key.", 10, 200);
        this.ctx.fillText("Zoom and shift are managed by wheel and middle click.", 10, 240);
        this.ctx.fillText("Image is able to be exported with \"left click save image as\" of navigator.", 10, 280);
    }

    disable(val) {
        $("#url_button").disable(val);
        $("#file_button").disable(val);
    }

    suppressCurrentLine() {
        if (this.current_line > 0 && this.current_line < this.lines.length) {
            this.lines.splice(this.current_line, 1);
            this.draw();
        }
    }

    drawImage() {
        var tr = this.transformation;
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle='#FFFFFF';
        this.ctx.beginPath();
        this.ctx.fillRect(tr.img_top_left.x, tr.img_top_left.y,
                            tr.image_size.x, tr.image_size.y);
        this.ctx.beginPath();
        this.ctx.globalAlpha = this.parameters.opacity;
        this.ctx.drawImage(this.image,
            tr.img_top_left.x, tr.img_top_left.y,
            tr.image_size.x, tr.image_size.y);
        this.ctx.globalAlpha = 1.00;
    }

    drawLines() {
        var linesNb = this.lines.length;
        for (var index = 0; index < linesNb; index++) {
            var line = this.transformation.getRealCoordinates(this.lines[index]);
            this.ctx.strokeStyle = this.parameters.lineColor;
            if (index == this.current_line) {
                this.ctx.strokeStyle = "#0033EE";
            }
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(line.x1, line.y1);
            this.ctx.lineTo(line.x2, line.y2);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            this.ctx.rect(line.x1 - 5, line.y1 - 5, 10, 10)
            this.ctx.rect(line.x2 - 5, line.y2 - 5, 10, 10)
            this.ctx.stroke();
        }
        this.drawLength();
    }

    drawLength() {
        var ratio = 1;
        var linesNb = this.lines.length;
        var fontStr = this.parameters.fontHeight.toString() + 'pt Calibri';
        this.ctx.font = fontStr;
        this.ctx.strokeStyle = this.parameters.lineColor;

        for (var index = 0; index < linesNb; index++) {
            var line = this.transformation.getRealCoordinates(this.lines[index]);
            /*var length = lineLength(this.lines[index]);*/
            var length = lineLength(line);
            var computeLength = 0;
            if (index == 0) {
                ratio = this.parameters.unitLength / length;
                computeLength = this.parameters.unitLength;
            } else {
                computeLength = length * ratio;
            }

            if (isNaN(computeLength))
                continue;

            var valueString = computeLength.toFixed(2).replace(/\.?0*$/, '');
            if(this.parameters.isCommaSeparator)
                valueString = valueString.replace('.', ',')
            else
                valueString = valueString.replace(',', '.')
            var txtBoundingBox = {
                x: this.ctx.measureText(valueString).width,
                y: parseInt(fontStr)
            };
            var lineBoundingBox = lineBoundingboxDimension(line);

            if ((lineBoundingBox.width - 10) > txtBoundingBox.x ||
                (lineBoundingBox.height - 10) > txtBoundingBox.y) {
                this.drawLegend(lineCenter(line), valueString, txtBoundingBox);
            }
        }
    }

    drawLegend(centerPos, text, txtBoundingBox) {
        var topLeftText = {
            x: centerPos.x - txtBoundingBox.x / 2.0,
            y: centerPos.y + txtBoundingBox.y / 2.0
        };
        var rectOverSize = 5;
        var topLeftRect = {
            x: centerPos.x - txtBoundingBox.x / 2.0 - rectOverSize,
            y: centerPos.y - txtBoundingBox.y / 2.0 - rectOverSize
        };
        var sizeRect = {
            width: txtBoundingBox.x + 2 * rectOverSize,
            height: txtBoundingBox.y + 2 * rectOverSize
        };

        this.ctx.beginPath();
        var lastOpacity = this.ctx.globalAlpha;
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(topLeftRect.x, topLeftRect.y, sizeRect.width, sizeRect.height);
        this.ctx.globalAlpha = lastOpacity;

        this.ctx.strokeStyle = this.parameters.lineColor;
        this.ctx.fillStyle = this.parameters.lineColor;
        this.ctx.rect(topLeftRect.x, topLeftRect.y, sizeRect.width, sizeRect.height);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.fillText(text, topLeftText.x, topLeftText.y);
    }

}