import { pausableWatch, useBluetooth } from '@vueuse/core';
import { addTime } from '../services/db';

const LIGHTPASS_SERVICE = 'b5b0c9c5-36b4-474e-8922-1a4676c70002';
const NOTIFY_TAKE_CHARACTERISTIC = '5714ff7d-43d5-49f1-8f57-5c0ecbcfd459';

const { isConnected, device, requestDevice, server } = useBluetooth({
    filters: [{ services: [LIGHTPASS_SERVICE] }],
});

async function createConnection() {
    const service = await server.value!.getPrimaryService(LIGHTPASS_SERVICE);
    const characteristic = await service.getCharacteristic(NOTIFY_TAKE_CHARACTERISTIC);

    let baseDate: number;
    let firstTime: number;

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        if (event.target?.value) {
            const data = event.target?.value as DataView;
            const number = data.getUint32(0, true);
            if (!firstTime) {
                baseDate = new Date().getTime();
                firstTime = number;
            }
            addTime(baseDate + (number - firstTime));
        }
    });
}

const { stop } = pausableWatch(isConnected, (newIsConnected) => {
    if (!newIsConnected || !server.value) return;
    createConnection();
    stop();
});

export const useBLESensor = () => {
    return {
        isConnected,
        device,
        requestDevice,
    };
};
