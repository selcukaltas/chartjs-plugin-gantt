"use strict";

import {Element, Chart} from "chart.js"
import {Utils} from "../core/utils";

export class Rect extends Element {
    static get id() { return "rect"; }

    inRange(mouseX, mouseY) {
        const rect = this.rect;
        return (
            mouseX >= rect.x.from && mouseX <= rect.x.to &&
            mouseY >= rect.y.from && mouseY <= rect.y.to
        );
    }

    getCenterPoint() {
        return {
            x: this.x,
            y: this.y,
        }
    }

    getArea() {
        const rect = this.rect;
        return rect.x.size * rect.y.size;
    }

    draw(ctx) {
        ctx.save();

        ctx.lineWidth = this.borderWidth;
        ctx.strokeStyle = this.borderColor;
        ctx.fillStyle = this.backgroundColor;

        const rect = this.rect;
        this.roundedRect(ctx, rect.x.from, rect.y.from, rect.x.size, rect.y.size, 5);

        ctx.restore();
    }

    roundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + height - radius);
        ctx.arcTo(x, y + height, x + radius, y + height, radius);
        ctx.lineTo(x + width - radius, y + height);
        ctx.arcTo(x + width, y + height, x + width, y + height-radius, radius);
        ctx.lineTo(x + width, y + radius);
        ctx.arcTo(x + width, y, x + width - radius, y, radius);
        ctx.lineTo(x + radius, y);
        ctx.arcTo(x, y, x, y + radius, radius);
        ctx.fill();
    }
}
