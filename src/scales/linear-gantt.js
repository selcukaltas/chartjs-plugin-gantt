'use strict';

import {ScaleUtils} from "./scale-utils";
import {LinearScale, Ticks} from "chart.js";

class LinearGanttScaleZ extends LinearScale {
    static get id() { return 'linear-gantt'; }

    getRightValue(rawValue) {
        return ScaleUtils.getRightValue(this, rawValue);
    }

    determineDataLimits() {
        ScaleUtils.determineDataLimits(this);
        this.handleTickRangeOptions();
    }

    getLabelForValue(value) {
        console.log("val", value);

        return value;
    }
}

LinearGanttScaleZ.defaults = {
    ticks: {
        callback: value => value
    }
};

export function LinearGanttScale(Chart) {
    Chart.register(LinearGanttScaleZ);
}
