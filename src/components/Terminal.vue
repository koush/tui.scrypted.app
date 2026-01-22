<template>
  <div v-if="!activeDeviceId"
    style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
    <div style="opacity: 0.5;">Select a terminal session</div>
  </div>
  <div v-else style="width: 100%; height: 100%; display: flex; flex-direction: column;">
    <Teleport to="#app-title-portal" v-if="activeDeviceId === route.params.deviceId">
      <v-app-bar-title class="text-subtitle-2 text-uppercase" style="margin-top: 2px;">
        {{ activeDevice?.name || 'Loading...' }}
      </v-app-bar-title>
    </Teleport>
    <Teleport to="#app-title-buttons" v-if="activeDeviceId === route.params.deviceId">
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon size="small" variant="text" @click="copyLog">
            <v-icon size="small">{{ getFaPrefix('fa-copy') }}</v-icon>
          </v-btn>
        </template>
        <span>Copy Log</span>
      </v-tooltip>
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon size="small" variant="text" color="error" @click="clearTerminal">
            <v-icon size="small">{{ getFaPrefix('fa-broom-wide') }}</v-icon>
          </v-btn>
        </template>
        <span>Clear Terminal</span>
      </v-tooltip>
    </Teleport>
    <div class="ml-2 mr-2" ref="terminal" :style="{ flex: 1, height: '100%' }"></div>
  </div>
</template>

<script setup lang="ts">
import { connectPluginClient, connectedClient } from '@/common/client';
import { isDark } from '@/common/colors';
import { getFaPrefix } from '@/common/fa-prefix';
import { observeResize } from '@/common/resize-observer';
import { createAsyncQueue, createAsyncQueueFromGenerator } from "@scrypted/common/src/async-queue";
import { Deferred } from "@scrypted/common/src/deferred";
import { sleep } from "@scrypted/common/src/sleep";
import { StreamService } from '@scrypted/types';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import debounce from 'lodash/debounce';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeDeviceId = ref(route.params.deviceId?.toString());
watch(() => route.params.deviceId, () => {
  if (route.params.deviceId === activeDeviceId.value) {
    setTimeout(() => {
      term.focus();
    }, 200);
  }
});

const activeDevice = computed(() => {
  if (!activeDeviceId.value || !connectedClient.value) {
    return undefined;
  }
  return connectedClient.value.systemManager.getDeviceById(activeDeviceId.value);
});

const terminal = ref<HTMLElement>();

const dark = isDark();
function getTheme() {
  return dark.value
    ? undefined
    : {
      selectionBackground: '#0000ff55',
      foreground: "black",
      background: "white",
      cursor: "black",
    };
}

const term = new Terminal({
  theme: getTheme(),
  convertEol: true,
  fontSize: 12,
});

watch(() => dark.value, () => {
  term.options.theme = getTheme();
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const terminalResize = debounce(() => fitAddon.fit(), 50);
const terminalSize = observeResize(terminal);
watch(() => terminalSize.value, terminalResize);

let buffer: Buffer[] = [];

const unmounted = new Deferred<void>();
onUnmounted(() => unmounted.resolve());
unmounted.promise.then(() => {
  window.removeEventListener('resize', terminalResize);
  term.dispose();
});


let localQueue: ReturnType<typeof createAsyncQueueFromGenerator>;
let connectionId = 0;

function refreshOnUpdate() {
  connectionId++;
  localQueue?.end();
  localQueue = undefined;
  if (terminal.value) {
    term.clear();
    term.focus();
  }
  buffer = [];
  connectPty();
}

watch(() => activeDeviceId.value, refreshOnUpdate);

watch(() => terminal.value, () => {
  if (!terminal.value)
    return;
  term.open(terminal.value);
  fitAddon.fit();
  term.focus();
  if (activeDeviceId.value) {
    connectPty();
  }
});

async function connectPty() {
  if (!activeDeviceId.value) {
    return;
  }

  const myConnectionId = connectionId;
  term.clear();
  term.reset();
  buffer = [];

  const dataQueue = createAsyncQueue<Buffer>();
  unmounted.promise.then(() => dataQueue.end());

  const ctrlQueue = createAsyncQueue();

  ctrlQueue.enqueue({ interactive: true });
  ctrlQueue.enqueue({ dim: { cols: term.cols, rows: term.rows } });

  let bufferedLength = 0;
  const MAX_BUFFERED_LENGTH = 64000;
  async function dataQueueEnqueue(data: Buffer) {
    bufferedLength += data.length;
    const promise = dataQueue.enqueue(data).then(() => bufferedLength -= data.length);
    if (bufferedLength >= MAX_BUFFERED_LENGTH) {
      term.options.disableStdin = true;
      await promise;
      if (bufferedLength < MAX_BUFFERED_LENGTH)
        term.options.disableStdin = false;
    }
  }

  term.onData(data => dataQueueEnqueue(Buffer.from(data, 'utf8')));
  term.onBinary(data => dataQueueEnqueue(Buffer.from(data, 'binary')));
  term.onResize(dim => {
    ctrlQueue.enqueue({ dim });
    dataQueue.enqueue(Buffer.alloc(0));
  });

  async function* localGenerator() {
    while (true) {
      const ctrlBuffers = ctrlQueue.clear();
      if (ctrlBuffers.length) {
        for (const ctrl of ctrlBuffers) {
          yield JSON.stringify(ctrl);
        }
        continue;
      }

      const dataBuffers = dataQueue.clear();
      if (dataBuffers.length === 0) {
        const buf = await dataQueue.dequeue();
        if (buf.length)
          yield buf;
        continue;
      }

      const concat = Buffer.concat(dataBuffers);
      if (concat.length)
        yield concat;
    }
  }

  localQueue = createAsyncQueueFromGenerator(localGenerator());

  try {
    await connectPluginClient();

    const { systemManager, connectRPCObject } = connectedClient.value!;

    const streamSvc = systemManager.getDeviceById<StreamService<Buffer | string, Buffer>>(activeDeviceId.value);
    const streamSvcDirect = await connectRPCObject(streamSvc);
    const remoteGenerator = await streamSvcDirect.connectStream(localQueue.queue as AsyncGenerator<Buffer | string>);

    for await (const message of remoteGenerator) {
      if (myConnectionId !== connectionId) {
        break;
      }
      if (!message) {
        break;
      }
      const b = Buffer.from(message);
      buffer.push(b);
      term.write(new Uint8Array(message));
    }

  }
  finally {
    await sleep(1000);
    if (unmounted.finished || myConnectionId !== connectionId)
      return;
    connectPty();
  }
}

function clearTerminal() {
  term.clear();
  term.reset();
  buffer = [];
}

function copyLog() {
  const text = Buffer.concat(buffer).toString();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
</script>
