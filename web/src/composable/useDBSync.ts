import { SyncClient, SyncRequest, SyncResponse } from '@kele23/levelshare';
import { ref } from 'vue';
import { instance } from '../services/axios.ts';
import { db, emitter } from '../services/db.ts';
import { useLogin } from './useLogin.ts';

const syncClient = new SyncClient(db);
syncClient.setTransporter(async (data: SyncRequest): Promise<SyncResponse> => {
    const response = await instance.post<SyncResponse>('/dbs/lightpass/sync', data);
    return response.data;
});

const { isLogged } = useLogin();
const lastSync = ref<Date | undefined>();
const syncing = ref(false);
const syncFn = async () => {
    if (!isLogged.value) return; // not logged
    if (syncing.value) return; // already syncing

    try {
        syncing.value = true;
        await syncClient.sync();
        emitter.emit('db:change');
        lastSync.value = new Date();
    } catch (e) {
        console.warn(e);
    } finally {
        syncing.value = false;
    }
};

// start timeout, sync every 20000 ( 20 seconds )
let timeout: NodeJS.Timeout | null = null;
const timeoutFn = async () => {
    timeout = null;
    await syncFn();
    timeout = setTimeout(timeoutFn, 20000);
};
timeout = setTimeout(timeoutFn, 20000);

// start db listener, sync after 1 seconds of change
const onChange = async () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(timeoutFn, 1000);
};

db.on('put', onChange);
db.on('del', onChange);
db.on('batch', onChange);
db.on('clear', onChange);

// first sync
export function useDBSync() {
    return {
        syncing,
        lastSync,
        syncNow: () => {
            syncFn();
        },
    };
}
