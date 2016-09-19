class Transformation {
    constructor(imageHandler) {
        this.imHandler = imageHandler;
        this.image_size = null;
        this.img_top_left = null;
        this.img_bottom_right = null;
        this.left_border = 0;
        this.top_border = 0;
        this.translate = {
            x: 0,
            y: 0
        };
        this.zoom = 1.;
    }

    reset() {
        this.translate = {
            x: 0,
            y: 0
        };
        this.zoom = 1.;
    }

    update() {
        if (this.imHandler.imageLoaded == false)
            return;
        var canvas = this.imHandler.canvas;
        this.image_size = this.computeNewImagesize();

        var x_border = (canvas.attr("width") - this.image_size.x) / 2.0 - this.translate.x;
        var y_border = (canvas.attr("height") - this.image_size.y) / 2.0 - this.translate.y;
        this.img_top_left = {
            x: x_border,
            y: y_border
        };
        this.img_bottom_right = {
            x: (x_border + this.image_size.x),
            y: (y_border + this.image_size.y)
        };
    }

    computeNewImagesize() {
        var image = this.imHandler.image;
        var canvas = this.imHandler.canvas;

        var maxWidth = canvas.attr("width") - 2 * this.imHandler.min_border.x;
        var maxHeight = canvas.attr("height") - 2 * this.imHandler.min_border.y;
        var ratio = Math.min(maxWidth / image.width, maxHeight / image.height) * this.zoom;
        return {
            x: image.width * ratio,
            y: image.height * ratio
        };
    }

    setTranslate(x, y) {
        if (this.imHandler.imageLoaded == false || this.zoom == 1.)
            return;

        this.translate.x += x;
        this.translate.y += y;
        this.update();
    }

    setZoom(z, client_x, client_y) {
        if (this.imHandler.imageLoaded == false)
            return;

        var real_corr = this.getLocalCoordinatesFromEvent(client_x, client_y);
        if (z < 0)
            this.zoom += 1;
        else
            this.zoom = Math.max(1, this.zoom - 1);

        var new_image_size = this.computeNewImagesize();
        var add_size_x = (new_image_size.x - this.image_size.x) / 2.0;
        var add_size_y = (new_image_size.y - this.image_size.y) / 2.0;

        var x1_real = real_corr.x * new_image_size.x + this.img_top_left.x - add_size_x;
        var y1_real = real_corr.y * new_image_size.y + this.img_top_left.y - add_size_y;

        if (this.zoom != 1) {
            var translate_x = this.translate.x + x1_real - client_x;
            var translate_y = this.translate.y + y1_real - client_y;
            this.translate = {
                x: translate_x,
                y: translate_y
            };
        } else
            this.translate = {
                x: 0,
                y: 0
            };
        this.update();
    }

    getLocalCoordinatesFromEvent(local_x, local_y) {
        var x_local = (local_x - this.img_top_left.x) / this.image_size.x;
        var y_local = (local_y - this.img_top_left.y) / this.image_size.y;
        return {
            x: x_local,
            y: y_local
        };
    }

    getRealCoordinates(line) {
        var x1_real = line.x1 * this.image_size.x + this.img_top_left.x;
        var y1_real = line.y1 * this.image_size.y + this.img_top_left.y;
        var x2_real = line.x2 * this.image_size.x + this.img_top_left.x;
        var y2_real = line.y2 * this.image_size.y + this.img_top_left.y;
        return {
            x1: x1_real,
            y1: y1_real,
            x2: x2_real,
            y2: y2_real
        };
    }
}