'use strict';

import {ScaleUtils} from "./scale-utils";
import {LinearScale} from "chart.js";

export class LinearGanttScale extends LinearScale {
    static get id() { return 'linear-gantt'; }

    getRightValue(rawValue) {
        return ScaleUtils.getRightValue(this, rawValue);
    }

    determineDataLimits() {
        ScaleUtils.determineDataLimits(this);
        this.handleTickRangeOptions();
    }

    getLabelForValue(value) {
        return value;
    }
}

LinearGanttScale.defaults = {
    ticks: {
        callback: value => value
    }
};
