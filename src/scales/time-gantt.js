'use strict';

import {ScaleUtils} from "./scale-utils";

export function TimeGanttScale(Chart) {

    const scale = Object.assign({}, Chart.registry.getScale('time'), {
        isTime: true,
        id: 'time-gantt',

        getRightValue: function (rawValue) {
            return ScaleUtils.getRightValue(this, rawValue);
        },

        determineDataLimits: function () {
            this.__proto__.__proto__.determineDataLimits.call(this);
            ScaleUtils.determineDataLimits(this);
        },

        getLabelForIndex: function (index, datasetIndex) {
            return ScaleUtils.getLabelForIndex(this, index, datasetIndex);
        }
    });

    Chart.register(scale);
}
