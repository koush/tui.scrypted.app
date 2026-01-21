<template>
  <v-app-bar class="elevation-0">
    <v-app-bar-nav-icon variant="text" @click="modelValue = !modelValue" class="mt-1"
     >
      <v-icon>{{ getFaPrefix('fa-sidebar') }}</v-icon>
    </v-app-bar-nav-icon>
    <v-spacer></v-spacer>
    <div id="app-title-portal" class="mr-4"></div>
    <div id="app-title-buttons"></div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { getFaPrefix } from '@/common/fa-prefix';

const modelValue = defineModel<boolean>();
</script>
