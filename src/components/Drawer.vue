<template>
  <v-navigation-drawer v-model="modelValue" :permanent="!isTouchDevice" temporary style="z-index: 2000;">
    <div style="display: flex; flex-direction: column; height: 100%;">
      <v-toolbar class="pt-1">
        <v-app-bar-nav-icon variant="text" :size="isTouchPhone ? 'small' : undefined" @click="modelValue = !modelValue">
          <v-icon>{{ getFaPrefix('fa-sidebar') }}</v-icon>
        </v-app-bar-nav-icon>
        <v-spacer></v-spacer>
        <v-btn href="#/settings" icon>
          <v-icon size="small">{{ getFaPrefix('fa-gear') }}</v-icon>
        </v-btn>
        <template v-if="isLoggedIn">
          <v-btn @click="logoutClient" icon>
            <v-icon size="small">{{ getFaPrefix('fa-arrow-right-from-bracket') }}</v-icon>
          </v-btn>
        </template>
      </v-toolbar>
      <v-toolbar density="compact" color="transparent">
        <template v-slot:append>
          <v-btn @click="if (isTouchPhone) { modelValue = false; }" href="#/" icon color="primary"
            :disabled="route.params.deviceId === undefined">
            <v-icon :size="isTouchPhone ? 'small' : undefined">{{ getFaPrefix('fa-plug') }}</v-icon>
          </v-btn>
        </template>
        <v-toolbar-title style="text-transform: uppercase; font-size: .8rem">Terminals</v-toolbar-title>
      </v-toolbar>
      <v-divider class="mb-4"></v-divider>
      <div class="terminals-drawer">
        <v-list density="compact" nav style="position: absolute; width: 100%;">
          <v-list-item v-for="device of terminals" :key="device.id" link :href="`#/terminal/${device.id}`"
            :active="device.id === activeDeviceId" @click="selectTerminal(device.id)"
            class="unselectable mb-0 pt-0 pb-0" style="height: 36px !important; min-height: 36px !important">
            <template v-slot:title>
              <v-list-item-title class="font-weight-medium" style="opacity: .95 !important;">{{ device.name
                }}</v-list-item-title>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { getAllDevices } from '@/common/devices';
import { isLoggedIn, logoutClient } from '@/common/client';
import { getFaPrefix } from '@/common/fa-prefix';
import { isTouchDevice, isTouchPhone } from '@/common/size';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { ScryptedInterface, type ScryptedDevice } from '@scrypted/types';

const route = useRoute();
const router = useRouter();

const modelValue = defineModel<boolean>('modelValue');

const activeDeviceId = computed(() => route.params.deviceId?.toString());

const terminals = computed(() => {
  return getAllDevices<ScryptedDevice>()
    .filter(device =>
      device.interfaces.includes(ScryptedInterface.TTY) &&
      device.interfaces.includes(ScryptedInterface.StreamService) && !device.interfaces.includes(ScryptedInterface.ChatCompletion)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
});

function selectTerminal(deviceId: string) {
  router.push({ name: 'Terminal', params: { deviceId } });
  if (isTouchPhone.value) {
    modelValue.value = false;
  }
}

const theme = useTheme();
const surfaceColor = computed(() => theme.current.value.colors.background);
</script>

<style scoped>
.unselectable {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.terminals-drawer {
  flex: 1;
  position: relative;
  overflow-y: scroll;
  scrollbar-width: thin;
  scrollbar-color: v-bind(surfaceColor) transparent;
}
</style>
