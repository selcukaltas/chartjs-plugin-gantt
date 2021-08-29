"use strict";

import {Rect} from "../elements/rect";
import {Utils} from "../core/utils";
import {Chart} from "chart.js"

const defaults = Chart.defaults;

defaults.elements.gantt = {
    borderWidth: 1,
    borderColor: defaults.defaultColor,
    backgroundColor: defaults.defaultColor,
};

class GanttControllerZ extends Chart.DatasetController {
    static get id() { return "gantt"; }

    _prepareData(data, dataset) {
        return {
            x: Utils.extendValue(data.x, dataset._width),
            y: Utils.extendValue(data.y, dataset._height),
        }
    }

    _calcBounds(scale, scaleValue) {
        const from = scale.getPixelForValue(scaleValue.from);
        const to = scale.getPixelForValue(scaleValue.to);
        const res = {
            from: from,
            to: to,
        };
        Utils.normalize(res);
        res.size = res.to - res.from;
        return res;
    }

    update(reset) {
        const meta = this.getMeta();
        const dataset = this.getDataset();
        const xScale = this.getScaleForId(meta.xAxisID);
        const yScale = this.getScaleForId(meta.yAxisID);

        dataset._width = Utils.convertSize(xScale, Chart.helpers.valueOrDefault(dataset.width, defaults.gantt.width));
        dataset._height = Utils.convertSize(yScale, Chart.helpers.valueOrDefault(dataset.height, defaults.gantt.height));

        const globalOptionGantt = defaults.elements.gantt;

        const data = meta.data || [];
        for (let i = 0; i < data.length; i++)
            this.updateElement(data[i], i, reset);
    }

    updateElements(points, start, count, mode) {
        for (let i = start; i < count; i++) {
            this.updateElement(points[i], i, mode === 'reset');
        }
    }

    updateElement(point, index, reset) {
        const meta = this.getMeta();
        const dataset = this.getDataset();
        const datasetIndex = this.index;
        const xScale = this.getScaleForId(meta.xAxisID);
        const yScale = this.getScaleForId(meta.yAxisID);
        const value = dataset.data[index];

        // Utility
        point._xScale = xScale;
        point._yScale = yScale;
        point._datasetIndex = datasetIndex;
        point._index = index;

        const fullPoint = this._prepareData(value, dataset);

        Object.assign(point, {
            rect: {
                x: this._calcBounds(xScale, fullPoint.x),
                y: this._calcBounds(yScale, fullPoint.y),
            },
            borderWidth: value.borderWidth || this.borderWidth,
            borderColor: value.borderColor || this.borderColor,
            backgroundColor: value.backgroundColor || this.backgroundColor,
        });

        Object.assign(point, {
            x: Utils.getMiddle(point.rect.x),
            y: Utils.getMiddle(point.rect.y)
        });

        //point.pivot();
    }
}

GanttControllerZ.defaults = {
    dataElementType: "rect",
//    datasetElementType: "rect",
    height: 5,
    width: 5
};

Chart.defaults.gantt = GanttControllerZ.overrides = {
    scales: {
        _index_: {
            id: 'x',
            active: true,
            type: 'time-gantt',
            position: 'bottom'
        },
        _value_: {
            id: 'y',
            active: true,
            type: 'linear-gantt',
            position: 'left'
        }
    }
}

export function GanttController(Chart) {
    Chart.register(GanttControllerZ);
}
