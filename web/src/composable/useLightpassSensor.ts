import { ref, watch } from 'vue';
import { useBluetooth } from './useBluetooth.ts';
import { useTimes } from './useTimes.ts';
import { getMachineId } from '../services/utils.ts';

const LIGHTPASS_SERVICE = 'b5b0c9c5-36b4-474e-8922-1a4676c70002';
const NOTIFY_CHARACTERISTIC = '5714ff7d-43d5-49f1-8f57-5c0ecbcfd459';
const TIMES_CHARACTERISTIC = 'e0ec91ab-e8bb-4779-a1a0-6582ec9d977e';

const { isConnected, device, server, requestDevice } = useBluetooth({
    filters: [{ services: [LIGHTPASS_SERVICE] }],
});

let baseDate: number;
let firstTime: number;

async function createConnection() {
    const { addTime } = useTimes();
    if (!isConnected || !server?.value) return;

    const service = await server.value.getPrimaryService(LIGHTPASS_SERVICE);
    const characteristic = await service.getCharacteristic(NOTIFY_CHARACTERISTIC);

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        if (event.target?.value) {
            const data = event.target?.value as DataView;
            const number = data.getUint32(0, true);
            if (!firstTime) {
                baseDate = new Date().getTime();
                firstTime = number;
            }
            addTime({ time: baseDate + (number - firstTime), deviceId: getMachineId() });
        }
    });
}

// when connected -> create connection to notification
watch(isConnected, (newIsConnected) => {
    if (!newIsConnected) return;
    createConnection();
});

export const useLightpassSensor = () => {
    const deviceTimes = ref<number[]>();

    watch(server, async () => {
        if (!server.value) return;

        const service = await server.value.getPrimaryService(LIGHTPASS_SERVICE);
        const characteristic = await service.getCharacteristic(TIMES_CHARACTERISTIC);

        const data = await characteristic.readValue();
        const tmp = [] as number[];
        for (let i = 0; i < data.byteLength; i++) {
            // every 4 bytes
            if (i % 4 == 0) {
                const number = data.getUint32(i, true);
                tmp.push(baseDate + (number - firstTime));
            }
        }

        deviceTimes.value = tmp;
    });

    return {
        isConnected,
        device,
        requestDevice,
        deviceTimes,
    };
};
