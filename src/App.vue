<template>
  <v-app v-if="!isLoggedIn" style="background-color: #6200EA;">
    <Login title="Terminal"></Login>
  </v-app>
  <v-app v-else-if="cloudLoginRedirect" style="background-color: #6200EA;">
    <CloudLogin></CloudLogin>
  </v-app>
  <v-app v-else>
    <AppBar v-model="drawer"></AppBar>
    <Drawer v-if="showDrawer" v-model="drawer" style=" top: 0; height: 100% !important;"></Drawer>
    <v-main style="padding-top: 64px !important;">
      <router-view v-slot="{ Component, route }" style="width: 100%; height: 100%;">
        <transition name="fade" mode="out-in">
          <KeepAlive :max="10">
            <component :is="Component" :key="(route.path.startsWith('/terminal/') ? route.path : route.name)" />
          </KeepAlive>
        </transition>
      </router-view>
      <v-snackbar color="warning" :model-value="!connectedClient" :timeout="-1" close-on-content-click>
        <div style="display: flex; justify-content: center;">
          <div class="mr-4">
            <v-icon size="small">{{ getFaPrefix('fa-wifi-slash') }}</v-icon>
          </div>
          <div style="margin-top: 2px;" class="mr-6">Disconnected</div>
        </div>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useTheme } from 'vuetify';
import * as packageJson from '../package.json';
import { clientAppVersion, cloudLoginRedirect, connectedClient, connectPluginClient, isLoggedIn, setAppDomain, setClientAppVersion, setClientConnectionPreferences, setClientPluginId, isAppDomain } from './common/client';
import CloudLogin from './common/components/CloudLogin.vue';
import Login from './common/components/Login.vue';
import { getFaPrefix } from './common/fa-prefix';
import { getThemeManager } from "./common/theme";
import AppBar from './components/AppBar.vue';
import Drawer from './components/Drawer.vue';
import { drawer, showDrawer } from './components/drawer';
import './init';

getThemeManager().updateTheme();

setClientAppVersion(packageJson.version);
console.log('tui ui version', clientAppVersion);
setClientPluginId('@scrypted/core');
setAppDomain('tui.scrypted.app', false);
setClientConnectionPreferences({
  webrtc: false,
});

if (!isAppDomain()) {
  navigator.serviceWorker?.getRegistration().then(registration => {
    if (registration) {
      console.warn('unregistering service worker', registration);
      registration.unregister();
    }
  });
}

connectPluginClient();

const theme = useTheme();
watch(() => theme.global.name.value, () => {
  if ('light' === theme.global.name.value) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});
</script>
<style>
html {
  font-size: 16px !important;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}
</style>
