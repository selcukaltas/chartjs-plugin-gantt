/*!
 * chartjs-plugin-gantt
 * https://github.com/anton-shchyrov/chartjs-plugin-gantt#readme
 * Version: 0.9.0
 *
 * Copyright 2019 Anton Shchyrov
 * Released under the Apache 2.0 license
 * https://github.com/anton-shchyrov/chartjs-plugin-gantt#LICENSE
 */

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GanttController = void 0;
var _rect = require("../elements/rect");
var _utils = require("../core/utils");
var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);
const defaults = _chart.Chart.defaults;
defaults.elements.gantt = {
  borderWidth: 1,
  borderColor: defaults.defaultColor,
  backgroundColor: defaults.defaultColor
};
class GanttController extends _chart.Chart.DatasetController {
  static get id() {
    return "gantt";
  }
  _prepareData(data, dataset) {
    return {
      x: _utils.Utils.extendValue(data.x, dataset._width),
      y: _utils.Utils.extendValue(data.y, dataset._height)
    };
  }
  _calcBounds(scale, scaleValue) {
    const from = scale.getPixelForValue(scaleValue.from);
    const to = scale.getPixelForValue(scaleValue.to);
    const res = {
      from: from,
      to: to
    };
    _utils.Utils.normalize(res);
    res.size = res.to - res.from;
    return res;
  }
  update(reset) {
    const meta = this.getMeta();
    const dataset = this.getDataset();
    const xScale = this.getScaleForId(meta.xAxisID);
    const yScale = this.getScaleForId(meta.yAxisID);
    dataset._width = _utils.Utils.convertSize(xScale, _chart.Chart.helpers.valueOrDefault(dataset.width, defaults.gantt.width));
    dataset._height = _utils.Utils.convertSize(yScale, _chart.Chart.helpers.valueOrDefault(dataset.height, defaults.gantt.height));
    const globalOptionGantt = defaults.elements.gantt;
    const data = meta.data || [];
    for (let i = 0; i < data.length; i++) this.updateElement(data[i], i, reset);
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
        y: this._calcBounds(yScale, fullPoint.y)
      },
      borderWidth: value.borderWidth || this.borderWidth,
      borderColor: value.borderColor || this.borderColor,
      backgroundColor: value.backgroundColor || this.backgroundColor
    });
    Object.assign(point, {
      x: _utils.Utils.getMiddle(point.rect.x),
      y: _utils.Utils.getMiddle(point.rect.y)
    });

    //point.pivot();
  }
}
exports.GanttController = GanttController;
GanttController.defaults = {
  dataElementType: "rect",
  //    datasetElementType: "rect",
  height: 5,
  width: 5
};
_chart.Chart.defaults.gantt = GanttController.overrides = {
  scales: {
    _index_: {
      id: 'x',
      active: true,
      type: 'linear-gantt',
      position: 'bottom'
    },
    _value_: {
      id: 'y',
      active: true,
      type: 'linear-gantt',
      position: 'left'
    }
  }
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../core/utils":2,"../elements/rect":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Utils = void 0;
const Utils = {
  _parseInterval: function (value) {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = value.trim().toLowerCase().split(/\s*(\d+)\s*/);
      let cur = "ms";
      const obj = {};
      for (let i = parsed.length - 1; i > 0; i--) {
        const num = parseFloat(parsed[i]);
        if (isFinite(num)) obj[cur] = num;else cur = parsed[i];
      }
      value = obj;
    }
    const coefs = {
      ms: 1,
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24
    };
    let res = 0;
    for (let key in value) {
      if (coefs[key]) res += value[key] * coefs[key];
    }
    return res;
  },
  isRange: function (value) {
    return typeof value.from !== "undefined" && typeof value.to !== "undefined";
  },
  getValue: function (rawValue, scale) {
    if (typeof rawValue === 'string') return +rawValue;

    // Null and undefined values first
    if (typeof rawValue === "undefined" || rawValue === null) return NaN;
    // isNaN(object) returns true, so make sure NaN is checking for a number; Discard Infinite values
    if (typeof rawValue === 'number' && !isFinite(rawValue)) {
      return NaN;
    }
    // If it is in fact an object, dive in one more level
    if (rawValue) {
      const nested = scale.isHorizontal() ? rawValue.x : rawValue.y;
      if (nested !== undefined) return this.getValue(nested, scale);
    }

    // Value is good, return it
    return rawValue;
  },
  _incMilliseconds: function (date, addend) {
    const res = new Date(date);
    res.setMilliseconds(res.getMilliseconds() + addend);
    return res;
  },
  extendValue: function (value, defSize) {
    if (this.isRange(value)) return value;
    if (!isFinite(value)) return NaN;
    const delta = defSize / 2;
    if (value instanceof Date) {
      return {
        from: this._incMilliseconds(value, -delta),
        to: this._incMilliseconds(value, delta)
      };
    }
    return {
      from: value - delta,
      to: value + delta
    };
  },
  isTimeScale: function (scale) {
    return scale.isTime || scale.type === "time";
  },
  convertSize: function (scale, size) {
    return this.isTimeScale(scale) ? this._parseInterval(size) : size;
  },
  normalize: function (value) {
    if (value.from > value.to) {
      const tmp = value.from;
      value.from = value.to;
      value.to = tmp;
    }
    return value;
  },
  getMiddle: function (value) {
    return (value.from + value.to) / 2;
  }
};
exports.Utils = Utils;

},{}],3:[function(require,module,exports){
(function (global){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rect = void 0;
var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);
var _utils = require("../core/utils");
class Rect extends _chart.Element {
  static get id() {
    return "rect";
  }
  inRange(mouseX, mouseY) {
    const rect = this.rect;
    return mouseX >= rect.x.from && mouseX <= rect.x.to && mouseY >= rect.y.from && mouseY <= rect.y.to;
  }
  getCenterPoint() {
    return {
      x: this.x,
      y: this.y
    };
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
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
  }
}
exports.Rect = Rect;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../core/utils":2}],4:[function(require,module,exports){
(function (global){(function (){
"use strict";

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);
var _gantt = require("./controllers/gantt");
var _linearGantt = require("./scales/linear-gantt");
var _timeGantt = require("./scales/time-gantt");
var _rect = require("./elements/rect");
_chart.Chart.register(_gantt.GanttController);
_chart.Chart.register(_linearGantt.LinearGanttScale);
_chart.Chart.register(_timeGantt.TimeGanttScale);
_chart.Chart.register(_rect.Rect);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./controllers/gantt":1,"./elements/rect":3,"./scales/linear-gantt":5,"./scales/time-gantt":7}],5:[function(require,module,exports){
(function (global){(function (){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LinearGanttScale = void 0;
var _scaleUtils = require("./scale-utils");
var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);
class LinearGanttScale extends _chart.LinearScale {
  static get id() {
    return 'linear-gantt';
  }
  getRightValue(rawValue) {
    return _scaleUtils.ScaleUtils.getRightValue(this, rawValue);
  }
  determineDataLimits() {
    _scaleUtils.ScaleUtils.determineDataLimits(this);
    this.handleTickRangeOptions();
  }
  getLabelForValue(value) {
    return value;
  }
}
exports.LinearGanttScale = LinearGanttScale;
LinearGanttScale.defaults = {
  ticks: {
    callback: value => value
  }
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./scale-utils":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScaleUtils = void 0;
var _utils = require("../core/utils");
const helpers = Chart.helpers;
const ScaleUtils = {
  getRightValue: function (scale, rawValue) {
    if (_utils.Utils.isRange(rawValue)) return _utils.Utils.getMiddle(rawValue);
    return scale.__proto__.__proto__.getRightValue.call(scale, rawValue);
  },
  determineDataLimits: function (scale) {
    const chart = scale.chart;
    const defaults = Chart.defaults.gantt || {};
    const isHorizontal = scale.isHorizontal();
    function IDMatches(meta) {
      return isHorizontal ? meta.xAxisID === scale.id : meta.yAxisID === scale.id;
    }
    scale.min = null;
    scale.max = null;
    helpers.each(chart.data.datasets, function (dataset, datasetIndex) {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (chart.isDatasetVisible(datasetIndex) && IDMatches(meta)) {
        const size = isHorizontal ? _utils.Utils.convertSize(scale, helpers.valueOrDefault(dataset.width, defaults.width)) : _utils.Utils.convertSize(scale, helpers.valueOrDefault(dataset.height, defaults.height));
        helpers.each(dataset.data, function (rawValue, index) {
          if (meta.data[index].hidden) {
            return;
          }
          const value = _utils.Utils.extendValue(_utils.Utils.getValue(rawValue, scale), size);
          if (typeof value !== "object" && isNaN(value)) return;
          _utils.Utils.normalize(value);
          if (scale.min === null || scale.min > value.from) scale.min = value.from;
          if (scale.max === null || scale.max < value.to) scale.max = value.to;
        });
      }
    });
  }
};
exports.ScaleUtils = ScaleUtils;

},{"../core/utils":2}],7:[function(require,module,exports){
(function (global){(function (){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeGanttScale = void 0;
var _scaleUtils = require("./scale-utils");
var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);
class TimeGanttScale extends _chart.TimeScale {
  static get isTime() {
    return true;
  }
  static get id() {
    return 'time-gantt';
  }
  getRightValue(rawValue) {
    return _scaleUtils.ScaleUtils.getRightValue(this, rawValue);
  }
  determineDataLimits() {
    this.__proto__.__proto__.determineDataLimits.call(this);
    //ScaleUtils.determineDataLimits(this);
  }

  getLabelForValue(value) {
    return value;
  }
}
exports.TimeGanttScale = TimeGanttScale;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./scale-utils":6}]},{},[4]);
