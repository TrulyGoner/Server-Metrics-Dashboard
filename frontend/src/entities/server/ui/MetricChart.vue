<script setup lang="ts">
import { computed } from 'vue'
import { Filler } from 'chart.js'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import type { MetricPoint } from '@/entities/server'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  metrics: MetricPoint[]
}>()

const chartData = computed(() => ({
  labels: props.metrics.map((_, i) => `${props.metrics.length - i}s`),
  datasets: [
    {
      label: 'CPU %',
      data: props.metrics.map(m => m.cpu),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
    },
    {
      label: 'RAM %',
      data: props.metrics.map(m => m.memory),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  animation: { duration: 200 },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: { 
        stepSize: 20,
        callback: (value: string | number) => `${value}%`,
      },
    },
    x: {
      ticks: { maxTicksLimit: 10 },
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
}
</script>

<template>
  <div class="chart">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped lang="scss">
.chart {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
</style>
