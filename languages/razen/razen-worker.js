/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { start } from './razen-server-start.js';

self.onmessage = (e) => {
    if (e.data.port instanceof MessagePort) {
        start(e.data.port, 'razen-server');
    }
};
