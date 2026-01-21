/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '../styles/theme.scss';
import { aliases, fa } from 'vuetify/iconsets/fa';

import '../../scripts/font-awesome';
import '@xterm/xterm/css/xterm.css';

import '../fonts/inter-4/inter.css';
import '../styles/quicksand.css';
import '../styles/vp-doc.css';
import { createVuetify } from 'vuetify';
import { themes } from './vuetify-themes';

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes,
  },
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: {
      fa,
    }
  },
})


