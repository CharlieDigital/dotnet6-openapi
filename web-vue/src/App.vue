<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from './components/HelloWorld.vue'
import  { ref, onBeforeMount } from 'vue'

// Import our client
import {
  OpenAPI,
  WeatherForecast,
  WeatherForecastService,
} from "../../web/references/codegen/index";

OpenAPI.BASE = "https://localhost:7277"; // Set this to match your local API endpoint.

let forecast = ref<WeatherForecast[]>();

// onBeforeMount( async () => {
//   forecast.value = await WeatherForecastService.getWeatherForecast();
// });

const loadForecast = async() => forecast.value = await WeatherForecastService.getWeatherForecast();

loadForecast();
</script>

<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
    <p v-for="day in forecast" :key="day.date">
      {{ day.summary }}
    </p>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
