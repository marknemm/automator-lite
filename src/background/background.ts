// This script runs in the background context of the extension.

import { initMessageForwarding } from '~shared/utils/messaging.js';

// Init content -> content script message forwarding.
initMessageForwarding();
