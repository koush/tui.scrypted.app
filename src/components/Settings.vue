<template>
  <div style="margin: 0 auto; width: 100%; max-width: 600px;" class="pt-4 pb-6 pl-2 pr-2">
    <div style="display: flex; justify-content: center;" class="mb-8">
      <h2 style="opacity: .75; font-weight: 320;">Settings</h2>
    </div>
    <v-list lines="two" class="rounded-xl elevation-1">
      <v-list-item class="mb-0 pt-4 pb-4">
        <template v-slot:title>
          <div class="font-weight-medium">Theme</div>
        </template>
        <template v-slot:subtitle>
          <div>Toggle between light and dark mode</div>
        </template>
        <template v-slot:append>
          <ThemeToggle icon />
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '@/common/components/ThemeToggle.vue';
</script>
