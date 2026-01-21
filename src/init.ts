import * as packageJson from '../package.json';
import { clientAppVersion, setAppDomain, setClientAppVersion, setClientPluginId } from './common/client';

setClientPluginId('@scrypted/core');
setAppDomain('tui.scrypted.app');
setClientAppVersion(packageJson.version);

console.log('tui ui version', clientAppVersion);
