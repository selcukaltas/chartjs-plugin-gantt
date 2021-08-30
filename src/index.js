"use strict";

import {Chart} from "chart.js"

import {GanttController} from './controllers/gantt';
import {LinearGanttScale} from './scales/linear-gantt'
import {TimeGanttScale} from "./scales/time-gantt";
import {Rect} from "./elements/rect";

Chart.register(GanttController);
Chart.register(LinearGanttScale);
Chart.register(TimeGanttScale);
Chart.register(Rect);