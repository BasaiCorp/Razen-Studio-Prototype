/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { startRazenServer } from './razen-vscode-extension/src/server/razenServer.js';

export let messageReader;
export let messageWriter;

export const start = (port, name) => {
    console.log(`Starting ${name}...`);
    const messageReader = new BrowserMessageReader(port);
    const messageWriter = new BrowserMessageWriter(port);

    const connection = createConnection(messageReader, messageWriter);

    startRazenServer(connection);
};
