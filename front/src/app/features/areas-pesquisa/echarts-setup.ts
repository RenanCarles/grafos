import { BarChart, SunburstChart, TreemapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, TreemapChart, SunburstChart, GridComponent, TooltipComponent, CanvasRenderer]);

export { echarts };
