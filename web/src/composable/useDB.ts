import { ClientConnection, P2PConnection, SyncManager } from '@kele23/level-sync';
import axios from 'axios';
import Peer from 'peerjs';
import { ref } from 'vue';
import { db } from '../services/db';

// p2p sync
const p2p = new Peer();
const p2pConnection = new P2PConnection(p2p);
const p2psync = new SyncManager(db, p2pConnection);
const p2pConnected = ref<string>();
p2p.on('connection', (dataConnection) => {
    p2pConnection.incomingConnection(dataConnection);
    p2pConnected.value = dataConnection.peer;
});

// client-server sync
const clientConnection = new ClientConnection(async (data: any) => {
    const response = await axios.put('/api/db', data);
    return response.data;
});
const clientSync = new SyncManager(db, clientConnection);

export function useDB() {
    return {
        db,
        id: p2p.id,
        p2pConnected,
        p2pConnectTo(id: string) {
            p2pConnection.connect(id);
            p2pConnected.value = id;
        },
        p2pDisconnectTo() {
            p2pConnection.disconnect();
            p2pConnected.value = undefined;
        },
        p2pDoPull() {
            p2psync.doPull();
        },
        p2pDoPush() {
            p2psync.doPush();
        },
        p2pDoSync() {
            p2psync.doSync();
        },
        clientDoPull() {
            clientSync.doPull();
        },
        clientDoPush() {
            clientSync.doPush();
        },
        clientDoSync() {
            clientSync.doSync();
        },
    };
}
