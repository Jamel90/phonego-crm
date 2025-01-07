// Import base ECharts
import * as echarts from 'echarts/core'

// Import charts that you need to use
import { PieChart } from 'echarts/charts'

// Import the components you need
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// Import renderer
import { CanvasRenderer } from 'echarts/renderers'

// Register globally (or you can do it in a component)
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PieChart,
  CanvasRenderer
])

export default echarts
