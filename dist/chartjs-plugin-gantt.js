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
    const value = dataset.data[index]; // Utility

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
    }); //point.pivot();
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
    if (typeof rawValue === 'string') return +rawValue; // Null and undefined values first

    if (typeof rawValue === "undefined" || rawValue === null) return NaN; // isNaN(object) returns true, so make sure NaN is checking for a number; Discard Infinite values

    if (typeof rawValue === 'number' && !isFinite(rawValue)) {
      return NaN;
    } // If it is in fact an object, dive in one more level


    if (rawValue) {
      const nested = scale.isHorizontal() ? rawValue.x : rawValue.y;
      if (nested !== undefined) return this.getValue(nested, scale);
    } // Value is good, return it


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
    ctx.fillRect(rect.x.from, rect.y.from, rect.x.size, rect.y.size);
    ctx.strokeRect(rect.x.from, rect.y.from, rect.x.size, rect.y.size);
    ctx.restore();
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

    _scaleUtils.ScaleUtils.determineDataLimits(this);
  }

  getLabelForValue(value) {
    return value;
  }

}

exports.TimeGanttScale = TimeGanttScale;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./scale-utils":6}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29udHJvbGxlcnMvZ2FudHQuanMiLCJzcmMvY29yZS91dGlscy5qcyIsInNyYy9lbGVtZW50cy9yZWN0LmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3NjYWxlcy9saW5lYXItZ2FudHQuanMiLCJzcmMvc2NhbGVzL3NjYWxlLXV0aWxzLmpzIiwic3JjL3NjYWxlcy90aW1lLWdhbnR0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOzs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTSxRQUFRLEdBQUcsYUFBTSxRQUF2QjtBQUVBLFFBQVEsQ0FBQyxRQUFULENBQWtCLEtBQWxCLEdBQTBCO0FBQ3RCLEVBQUEsV0FBVyxFQUFFLENBRFM7QUFFdEIsRUFBQSxXQUFXLEVBQUUsUUFBUSxDQUFDLFlBRkE7QUFHdEIsRUFBQSxlQUFlLEVBQUUsUUFBUSxDQUFDO0FBSEosQ0FBMUI7O0FBTU8sTUFBTSxlQUFOLFNBQThCLGFBQU0saUJBQXBDLENBQXNEO0FBQzVDLGFBQUYsRUFBRSxHQUFHO0FBQUUsV0FBTyxPQUFQO0FBQWlCOztBQUVuQyxFQUFBLFlBQVksQ0FBQyxJQUFELEVBQU8sT0FBUCxFQUFnQjtBQUN4QixXQUFPO0FBQ0gsTUFBQSxDQUFDLEVBQUUsYUFBTSxXQUFOLENBQWtCLElBQUksQ0FBQyxDQUF2QixFQUEwQixPQUFPLENBQUMsTUFBbEMsQ0FEQTtBQUVILE1BQUEsQ0FBQyxFQUFFLGFBQU0sV0FBTixDQUFrQixJQUFJLENBQUMsQ0FBdkIsRUFBMEIsT0FBTyxDQUFDLE9BQWxDO0FBRkEsS0FBUDtBQUlIOztBQUVELEVBQUEsV0FBVyxDQUFDLEtBQUQsRUFBUSxVQUFSLEVBQW9CO0FBQzNCLFVBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxnQkFBTixDQUF1QixVQUFVLENBQUMsSUFBbEMsQ0FBYjtBQUNBLFVBQU0sRUFBRSxHQUFHLEtBQUss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QWQsSUFBc0IsS0FBSyxDQUFDLEdBQU4sR0FBWSxLQUFLLENBQUMsRUFBNUMsRUFDSSxLQUFLLENBQUMsR0FBTixHQUFZLEtBQUssQ0FBQyxFQUFsQjtBQUNQLFNBakJEO0FBa0JIO0FBQ0osS0ExQkQ7QUEyQkg7QUE5Q3FCLENBQW5COzs7OztBQ05QOzs7Ozs7O0FBRUE7O0FBQ0E7O0FBRU8sTUFBTSxjQUFOLFNBQTZCLGdCQUE3QixDQUF1QztBQUN6QixhQUFOLE1BQU0sR0FBRztBQUFFLFdBQU8sSUFBUDtBQUFjOztBQUN2QixhQUFGLEVBQUUsR0FBRztBQUFFLFdBQU8sWUFBUDtBQUFzQjs7QUFFeEMsRUFBQSxhQUFhLENBQUMsUUFBRCxFQUFXO0FBQ3BCLFdBQU8sdUJBQVcsYUFBWCxDQUF5QixJQUF6QixFQUErQixRQUEvQixDQUFQO0FBQ0g7O0FBRUQsRUFBQSxtQkFBbUIsR0FBRztBQUNsQixTQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLG1CQUF6QixDQUE2QyxJQUE3QyxDQUFrRCxJQUFsRDs7QUFDQSwyQkFBVyxtQkFBWCxDQUErQixJQUEvQjtBQUNIOztBQUVELEVBQUEsZ0JBQWdCLENBQUMsS0FBRCxFQUFRO0FBQ3BCLFdBQU8sS0FBUDtBQUNIOztBQWZ5QyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQge1JlY3R9IGZyb20gXCIuLi9lbGVtZW50cy9yZWN0XCI7XG5pbXBvcnQge1V0aWxzfSBmcm9tIFwiLi4vY29yZS91dGlsc1wiO1xuaW1wb3J0IHtDaGFydH0gZnJvbSBcImNoYXJ0LmpzXCJcblxuY29uc3QgZGVmYXVsdHMgPSBDaGFydC5kZWZhdWx0cztcblxuZGVmYXVsdHMuZWxlbWVudHMuZ2FudHQgPSB7XG4gICAgYm9yZGVyV2lkdGg6IDEsXG4gICAgYm9yZGVyQ29sb3I6IGRlZmF1bHRzLmRlZmF1bHRDb2xvcixcbiAgICBiYWNrZ3JvdW5kQ29sb3I6IGRlZmF1bHRzLmRlZmF1bHRDb2xvcixcbn07XG5cbmV4cG9ydCBjbGFzcyBHYW50dENvbnRyb2xsZXIgZXh0ZW5kcyBDaGFydC5EYXRhc2V0Q29udHJvbGxlciB7XG4gICAgc3RhdGljIGdldCBpZCgpIHsgcmV0dXJuIFwiZ2FudHRcIjsgfVxuXG4gICAgX3ByZXBhcmVEYXRhKGRhdGEsIGRhdGFzZXQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IFV0aWxzLmV4dGVuZFZhbHVlKGRhdGEueCwgZGF0YXNldC5fd2lkdGgpLFxuICAgICAgICAgICAgeTogVXRpbHMuZXh0ZW5kVmFsdWUoZGF0YS55LCBkYXRhc2V0Ll9oZWlnaHQpLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2NhbGNCb3VuZHMoc2NhbGUsIHNjYWxlVmFsdWUpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHNjYWxlLmdldFBpeGVsRm9yVmFsdWUoc2NhbGVWYWx1ZS5mcm9tKTtcbiAgICAgICAgY29uc3QgdG8gPSBzY2FsZS5nZXRQaXhlbEZvclZhbHVlKHNjYWxlVmFsdWUudG8pO1xuICAgICAgICBjb25zdCByZXMgPSB7XG4gICAgICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICAgICAgdG86IHRvLFxuICAgICAgICB9O1xuICAgICAgICBVdGlscy5ub3JtYWxpemUocmVzKTtcbiAgICAgICAgcmVzLnNpemUgPSByZXMudG8gLSByZXMuZnJvbTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICB1cGRhdGUocmVzZXQpIHtcbiAgICAgICAgY29uc3QgbWV0YSA9IHRoaXMuZ2V0TWV0YSgpO1xuICAgICAgICBjb25zdCBkYXRhc2V0ID0gdGhpcy5nZXREYXRhc2V0KCk7XG4gICAgICAgIGNvbnN0IHhTY2FsZSA9IHRoaXMuZ2V0U2NhbGVGb3JJZChtZXRhLnhBeGlzSUQpO1xuICAgICAgICBjb25zdCB5U2NhbGUgPSB0aGlzLmdldFNjYWxlRm9ySWQobWV0YS55QXhpc0lEKTtcblxuICAgICAgICBkYXRhc2V0Ll93aWR0aCA9IFV0aWxzLmNvbnZlcnRTaXplKHhTY2FsZSwgQ2hhcnQuaGVscGVycy52YWx1ZU9yRGVmYXVsdChkYXRhc2V0LndpZHRoLCBkZWZhdWx0cy5nYW50dC53aWR0aCkpO1xuICAgICAgICBkYXRhc2V0Ll9oZWlnaHQgPSBVdGlscy5jb252ZXJ0U2l6ZSh5U2NhbGUsIENoYXJ0LmhlbHBlcnMudmFsdWVPckRlZmF1bHQoZGF0YXNldC5oZWlnaHQsIGRlZmF1bHRzLmdhbnR0LmhlaWdodCkpO1xuXG4gICAgICAgIGNvbnN0IGdsb2JhbE9wdGlvbkdhbnR0ID0gZGVmYXVsdHMuZWxlbWVudHMuZ2FudHQ7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IG1ldGEuZGF0YSB8fCBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVFbGVtZW50KGRhdGFbaV0sIGksIHJlc2V0KTtcbiAgICB9XG5cbiAgICB1cGRhdGVFbGVtZW50cyhwb2ludHMsIHN0YXJ0LCBjb3VudCwgbW9kZSkge1xuICAgICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUVsZW1lbnQocG9pbnRzW2ldLCBpLCBtb2RlID09PSAncmVzZXQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUVsZW1lbnQocG9pbnQsIGluZGV4LCByZXNldCkge1xuICAgICAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhKCk7XG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSB0aGlzLmdldERhdGFzZXQoKTtcbiAgICAgICAgY29uc3QgZGF0YXNldEluZGV4ID0gdGhpcy5pbmRleDtcbiAgICAgICAgY29uc3QgeFNjYWxlID0gdGhpcy5nZXRTY2FsZUZvcklkKG1ldGEueEF4aXNJRCk7XG4gICAgICAgIGNvbnN0IHlTY2FsZSA9IHRoaXMuZ2V0U2NhbGVGb3JJZChtZXRhLnlBeGlzSUQpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGRhdGFzZXQuZGF0YVtpbmRleF07XG5cbiAgICAgICAgLy8gVXRpbGl0eVxuICAgICAgICBwb2ludC5feFNjYWxlID0geFNjYWxlO1xuICAgICAgICBwb2ludC5feVNjYWxlID0geVNjYWxlO1xuICAgICAgICBwb2ludC5fZGF0YXNldEluZGV4ID0gZGF0YXNldEluZGV4O1xuICAgICAgICBwb2ludC5faW5kZXggPSBpbmRleDtcblxuICAgICAgICBjb25zdCBmdWxsUG9pbnQgPSB0aGlzLl9wcmVwYXJlRGF0YSh2YWx1ZSwgZGF0YXNldCk7XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihwb2ludCwge1xuICAgICAgICAgICAgcmVjdDoge1xuICAgICAgICAgICAgICAgIHg6IHRoaXMuX2NhbGNCb3VuZHMoeFNjYWxlLCBmdWxsUG9pbnQueCksXG4gICAgICAgICAgICAgICAgeTogdGhpcy5fY2FsY0JvdW5kcyh5U2NhbGUsIGZ1bGxQb2ludC55KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3JkZXJXaWR0aDogdmFsdWUuYm9yZGVyV2lkdGggfHwgdGhpcy5ib3JkZXJXaWR0aCxcbiAgICAgICAgICAgIGJvcmRlckNvbG9yOiB2YWx1ZS5ib3JkZXJDb2xvciB8fCB0aGlzLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB2YWx1ZS5iYWNrZ3JvdW5kQ29sb3IgfHwgdGhpcy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24ocG9pbnQsIHtcbiAgICAgICAgICAgIHg6IFV0aWxzLmdldE1pZGRsZShwb2ludC5yZWN0LngpLFxuICAgICAgICAgICAgeTogVXRpbHMuZ2V0TWlkZGxlKHBvaW50LnJlY3QueSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy9wb2ludC5waXZvdCgpO1xuICAgIH1cbn1cblxuR2FudHRDb250cm9sbGVyLmRlZmF1bHRzID0ge1xuICAgIGRhdGFFbGVtZW50VHlwZTogXCJyZWN0XCIsXG4vLyAgICBkYXRhc2V0RWxlbWVudFR5cGU6IFwicmVjdFwiLFxuICAgIGhlaWdodDogNSxcbiAgICB3aWR0aDogNVxufTtcblxuQ2hhcnQuZGVmYXVsdHMuZ2FudHQgPSBHYW50dENvbnRyb2xsZXIub3ZlcnJpZGVzID0ge1xuICAgIHNjYWxlczoge1xuICAgICAgICBfaW5kZXhfOiB7XG4gICAgICAgICAgICBpZDogJ3gnLFxuICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ3RpbWUtZ2FudHQnLFxuICAgICAgICAgICAgcG9zaXRpb246ICdib3R0b20nXG4gICAgICAgIH0sXG4gICAgICAgIF92YWx1ZV86IHtcbiAgICAgICAgICAgIGlkOiAneScsXG4gICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAnbGluZWFyLWdhbnR0JyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnbGVmdCdcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnQgY29uc3QgVXRpbHMgPSB7XG4gICAgX3BhcnNlSW50ZXJ2YWw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKS5zcGxpdCgvXFxzKihcXGQrKVxccyovKTtcbiAgICAgICAgICAgIGxldCBjdXIgPSBcIm1zXCI7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7fTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBwYXJzZWQubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG51bSA9IHBhcnNlRmxvYXQocGFyc2VkW2ldKVxuICAgICAgICAgICAgICAgIGlmIChpc0Zpbml0ZShudW0pKVxuICAgICAgICAgICAgICAgICAgICBvYmpbY3VyXSA9IG51bTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGN1ciA9IHBhcnNlZFtpXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBvYmo7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29lZnMgPSB7XG4gICAgICAgICAgICBtczogMSxcbiAgICAgICAgICAgIHM6IDEwMDAsXG4gICAgICAgICAgICBtOiAxMDAwICogNjAsXG4gICAgICAgICAgICBoOiAxMDAwICogNjAgKiA2MCxcbiAgICAgICAgICAgIGQ6IDEwMDAgKiA2MCAqIDYwICogMjRcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlcyA9IDA7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGNvZWZzW2tleV0pXG4gICAgICAgICAgICAgICAgcmVzICs9IHZhbHVlW2tleV0gKiBjb2Vmc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIGlzUmFuZ2U6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUuZnJvbSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgdmFsdWUudG8gIT09IFwidW5kZWZpbmVkXCI7XG4gICAgfSxcblxuICAgIGdldFZhbHVlOiBmdW5jdGlvbiAocmF3VmFsdWUsIHNjYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgcmV0dXJuICtyYXdWYWx1ZTtcblxuICAgICAgICAvLyBOdWxsIGFuZCB1bmRlZmluZWQgdmFsdWVzIGZpcnN0XG4gICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHwgcmF3VmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICAvLyBpc05hTihvYmplY3QpIHJldHVybnMgdHJ1ZSwgc28gbWFrZSBzdXJlIE5hTiBpcyBjaGVja2luZyBmb3IgYSBudW1iZXI7IERpc2NhcmQgSW5maW5pdGUgdmFsdWVzXG4gICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09ICdudW1iZXInICYmICFpc0Zpbml0ZShyYXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgaXQgaXMgaW4gZmFjdCBhbiBvYmplY3QsIGRpdmUgaW4gb25lIG1vcmUgbGV2ZWxcbiAgICAgICAgaWYgKHJhd1ZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWQgPSAoc2NhbGUuaXNIb3Jpem9udGFsKCkpID8gcmF3VmFsdWUueCA6IHJhd1ZhbHVlLnk7XG4gICAgICAgICAgICBpZiAobmVzdGVkICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWUobmVzdGVkLCBzY2FsZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyBnb29kLCByZXR1cm4gaXRcbiAgICAgICAgcmV0dXJuIHJhd1ZhbHVlO1xuICAgIH0sXG5cbiAgICBfaW5jTWlsbGlzZWNvbmRzOiBmdW5jdGlvbihkYXRlLCBhZGRlbmQpIHtcbiAgICAgICAgY29uc3QgcmVzID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICAgIHJlcy5zZXRNaWxsaXNlY29uZHMocmVzLmdldE1pbGxpc2Vjb25kcygpICsgYWRkZW5kKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgZXh0ZW5kVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSwgZGVmU2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5pc1JhbmdlKHZhbHVlKSlcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpXG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuXG4gICAgICAgIGNvbnN0IGRlbHRhID0gZGVmU2l6ZSAvIDI7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogdGhpcy5faW5jTWlsbGlzZWNvbmRzKHZhbHVlLCAtZGVsdGEpLFxuICAgICAgICAgICAgICAgIHRvOiB0aGlzLl9pbmNNaWxsaXNlY29uZHModmFsdWUsIGRlbHRhKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyb206IHZhbHVlIC0gZGVsdGEsXG4gICAgICAgICAgICB0bzogdmFsdWUgKyBkZWx0YSxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpc1RpbWVTY2FsZTogZnVuY3Rpb24oc2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIHNjYWxlLmlzVGltZSB8fCBzY2FsZS50eXBlID09PSBcInRpbWVcIjtcbiAgICB9LFxuXG4gICAgY29udmVydFNpemU6IGZ1bmN0aW9uIChzY2FsZSwgc2l6ZSkge1xuICAgICAgICByZXR1cm4gKHRoaXMuaXNUaW1lU2NhbGUoc2NhbGUpKSA/IHRoaXMuX3BhcnNlSW50ZXJ2YWwoc2l6ZSkgOiBzaXplO1xuICAgIH0sXG5cbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUuZnJvbSA+IHZhbHVlLnRvKSB7XG4gICAgICAgICAgICBjb25zdCB0bXAgPSB2YWx1ZS5mcm9tO1xuICAgICAgICAgICAgdmFsdWUuZnJvbSA9IHZhbHVlLnRvO1xuICAgICAgICAgICAgdmFsdWUudG8gPSB0bXA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG5cbiAgICBnZXRNaWRkbGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiAodmFsdWUuZnJvbSArIHZhbHVlLnRvKSAvIDI7XG4gICAgfVxufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHtFbGVtZW50LCBDaGFydH0gZnJvbSBcImNoYXJ0LmpzXCJcbmltcG9ydCB7VXRpbHN9IGZyb20gXCIuLi9jb3JlL3V0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWN0IGV4dGVuZHMgRWxlbWVudCB7XG4gICAgc3RhdGljIGdldCBpZCgpIHsgcmV0dXJuIFwicmVjdFwiOyB9XG5cbiAgICBpblJhbmdlKG1vdXNlWCwgbW91c2VZKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnJlY3Q7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtb3VzZVggPj0gcmVjdC54LmZyb20gJiYgbW91c2VYIDw9IHJlY3QueC50byAmJlxuICAgICAgICAgICAgbW91c2VZID49IHJlY3QueS5mcm9tICYmIG1vdXNlWSA8PSByZWN0LnkudG9cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBnZXRDZW50ZXJQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHRoaXMueCxcbiAgICAgICAgICAgIHk6IHRoaXMueSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEFyZWEoKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnJlY3Q7XG4gICAgICAgIHJldHVybiByZWN0Lnguc2l6ZSAqIHJlY3QueS5zaXplO1xuICAgIH1cblxuICAgIGRyYXcoY3R4KSB7XG4gICAgICAgIGN0eC5zYXZlKCk7XG5cbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuYm9yZGVyV2lkdGg7XG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyQ29sb3I7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcblxuICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5yZWN0O1xuICAgICAgICBjdHguZmlsbFJlY3QocmVjdC54LmZyb20sIHJlY3QueS5mcm9tLCByZWN0Lnguc2l6ZSwgcmVjdC55LnNpemUpO1xuICAgICAgICBjdHguc3Ryb2tlUmVjdChyZWN0LnguZnJvbSwgcmVjdC55LmZyb20sIHJlY3QueC5zaXplLCByZWN0Lnkuc2l6ZSk7XG5cbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHtDaGFydH0gZnJvbSBcImNoYXJ0LmpzXCJcblxuaW1wb3J0IHtHYW50dENvbnRyb2xsZXJ9IGZyb20gJy4vY29udHJvbGxlcnMvZ2FudHQnO1xuaW1wb3J0IHtMaW5lYXJHYW50dFNjYWxlfSBmcm9tICcuL3NjYWxlcy9saW5lYXItZ2FudHQnXG5pbXBvcnQge1RpbWVHYW50dFNjYWxlfSBmcm9tIFwiLi9zY2FsZXMvdGltZS1nYW50dFwiO1xuaW1wb3J0IHtSZWN0fSBmcm9tIFwiLi9lbGVtZW50cy9yZWN0XCI7XG5cbkNoYXJ0LnJlZ2lzdGVyKEdhbnR0Q29udHJvbGxlcik7XG5DaGFydC5yZWdpc3RlcihMaW5lYXJHYW50dFNjYWxlKTtcbkNoYXJ0LnJlZ2lzdGVyKFRpbWVHYW50dFNjYWxlKTtcbkNoYXJ0LnJlZ2lzdGVyKFJlY3QpOyIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtTY2FsZVV0aWxzfSBmcm9tIFwiLi9zY2FsZS11dGlsc1wiO1xuaW1wb3J0IHtMaW5lYXJTY2FsZX0gZnJvbSBcImNoYXJ0LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lYXJHYW50dFNjYWxlIGV4dGVuZHMgTGluZWFyU2NhbGUge1xuICAgIHN0YXRpYyBnZXQgaWQoKSB7IHJldHVybiAnbGluZWFyLWdhbnR0JzsgfVxuXG4gICAgZ2V0UmlnaHRWYWx1ZShyYXdWYWx1ZSkge1xuICAgICAgICByZXR1cm4gU2NhbGVVdGlscy5nZXRSaWdodFZhbHVlKHRoaXMsIHJhd1ZhbHVlKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVEYXRhTGltaXRzKCkge1xuICAgICAgICBTY2FsZVV0aWxzLmRldGVybWluZURhdGFMaW1pdHModGhpcyk7XG4gICAgICAgIHRoaXMuaGFuZGxlVGlja1JhbmdlT3B0aW9ucygpO1xuICAgIH1cblxuICAgIGdldExhYmVsRm9yVmFsdWUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuTGluZWFyR2FudHRTY2FsZS5kZWZhdWx0cyA9IHtcbiAgICB0aWNrczoge1xuICAgICAgICBjYWxsYmFjazogdmFsdWUgPT4gdmFsdWVcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1V0aWxzfSBmcm9tIFwiLi4vY29yZS91dGlsc1wiO1xuXG5jb25zdCBoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuZXhwb3J0IGNvbnN0IFNjYWxlVXRpbHMgPSB7XG4gICAgZ2V0UmlnaHRWYWx1ZTogZnVuY3Rpb24gKHNjYWxlLCByYXdWYWx1ZSkge1xuICAgICAgICBpZiAoVXRpbHMuaXNSYW5nZShyYXdWYWx1ZSkpXG4gICAgICAgICAgICByZXR1cm4gVXRpbHMuZ2V0TWlkZGxlKHJhd1ZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHNjYWxlLl9fcHJvdG9fXy5fX3Byb3RvX18uZ2V0UmlnaHRWYWx1ZS5jYWxsKHNjYWxlLCByYXdWYWx1ZSk7XG4gICAgfSxcblxuICAgIGRldGVybWluZURhdGFMaW1pdHM6IGZ1bmN0aW9uIChzY2FsZSkge1xuICAgICAgICBjb25zdCBjaGFydCA9IHNjYWxlLmNoYXJ0O1xuICAgICAgICBjb25zdCBkZWZhdWx0cyA9IENoYXJ0LmRlZmF1bHRzLmdhbnR0IHx8IHt9O1xuICAgICAgICBjb25zdCBpc0hvcml6b250YWwgPSBzY2FsZS5pc0hvcml6b250YWwoKTtcblxuICAgICAgICBmdW5jdGlvbiBJRE1hdGNoZXMobWV0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IG1ldGEueEF4aXNJRCA9PT0gc2NhbGUuaWQgOiBtZXRhLnlBeGlzSUQgPT09IHNjYWxlLmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NhbGUubWluID0gbnVsbDtcbiAgICAgICAgc2NhbGUubWF4ID0gbnVsbDtcblxuICAgICAgICBoZWxwZXJzLmVhY2goY2hhcnQuZGF0YS5kYXRhc2V0cywgZnVuY3Rpb24gKGRhdGFzZXQsIGRhdGFzZXRJbmRleCkge1xuICAgICAgICAgICAgY29uc3QgbWV0YSA9IGNoYXJ0LmdldERhdGFzZXRNZXRhKGRhdGFzZXRJbmRleCk7XG4gICAgICAgICAgICBpZiAoY2hhcnQuaXNEYXRhc2V0VmlzaWJsZShkYXRhc2V0SW5kZXgpICYmIElETWF0Y2hlcyhtZXRhKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSAoaXNIb3Jpem9udGFsKSA/XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmNvbnZlcnRTaXplKHNjYWxlLCBoZWxwZXJzLnZhbHVlT3JEZWZhdWx0KGRhdGFzZXQud2lkdGgsIGRlZmF1bHRzLndpZHRoKSkgOlxuICAgICAgICAgICAgICAgICAgICBVdGlscy5jb252ZXJ0U2l6ZShzY2FsZSwgaGVscGVycy52YWx1ZU9yRGVmYXVsdChkYXRhc2V0LmhlaWdodCwgZGVmYXVsdHMuaGVpZ2h0KSk7XG5cbiAgICAgICAgICAgICAgICBoZWxwZXJzLmVhY2goZGF0YXNldC5kYXRhLCBmdW5jdGlvbiAocmF3VmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRhLmRhdGFbaW5kZXhdLmhpZGRlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBVdGlscy5leHRlbmRWYWx1ZShVdGlscy5nZXRWYWx1ZShyYXdWYWx1ZSwgc2NhbGUpLCBzaXplKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICYmIGlzTmFOKHZhbHVlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBVdGlscy5ub3JtYWxpemUodmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZS5taW4gPT09IG51bGwgfHwgc2NhbGUubWluID4gdmFsdWUuZnJvbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlLm1pbiA9IHZhbHVlLmZyb207XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlLm1heCA9PT0gbnVsbCB8fCBzY2FsZS5tYXggPCB2YWx1ZS50bylcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlLm1heCA9IHZhbHVlLnRvO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtTY2FsZVV0aWxzfSBmcm9tIFwiLi9zY2FsZS11dGlsc1wiO1xuaW1wb3J0IHtUaW1lU2NhbGV9IGZyb20gXCJjaGFydC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGltZUdhbnR0U2NhbGUgZXh0ZW5kcyBUaW1lU2NhbGUge1xuICAgIHN0YXRpYyBnZXQgaXNUaW1lKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIHN0YXRpYyBnZXQgaWQoKSB7IHJldHVybiAndGltZS1nYW50dCc7IH1cblxuICAgIGdldFJpZ2h0VmFsdWUocmF3VmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIFNjYWxlVXRpbHMuZ2V0UmlnaHRWYWx1ZSh0aGlzLCByYXdWYWx1ZSk7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lRGF0YUxpbWl0cygpIHtcbiAgICAgICAgdGhpcy5fX3Byb3RvX18uX19wcm90b19fLmRldGVybWluZURhdGFMaW1pdHMuY2FsbCh0aGlzKTtcbiAgICAgICAgU2NhbGVVdGlscy5kZXRlcm1pbmVEYXRhTGltaXRzKHRoaXMpO1xuICAgIH1cblxuICAgIGdldExhYmVsRm9yVmFsdWUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cbiJdfQ==
