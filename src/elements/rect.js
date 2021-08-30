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
        ctx.fillRect(rect.x.from, rect.y.from, rect.x.size, rect.y.size);
        ctx.strokeRect(rect.x.from, rect.y.from, rect.x.size, rect.y.size);

        ctx.restore();
    }
}
