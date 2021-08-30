'use strict';

import {ScaleUtils} from "./scale-utils";
import {TimeScale} from "chart.js";

export class TimeGanttScale extends TimeScale {
    static get isTime() { return true; }
    static get id() { return 'time-gantt'; }

    getRightValue(rawValue) {
        return ScaleUtils.getRightValue(this, rawValue);
    }

    determineDataLimits() {
        this.__proto__.__proto__.determineDataLimits.call(this);
        ScaleUtils.determineDataLimits(this);
    }

    getLabelForValue(value) {
        return value;
    }
}
