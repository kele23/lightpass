import { ConfigurableNavigator, defaultNavigator, useSupported } from '@vueuse/core';
import type { Ref } from 'vue';
import { ref, shallowRef } from 'vue';

export interface UseBluetoothRequestDeviceOptions {
    /**
     *
     * An array of BluetoothScanFilters. This filter consists of an array
     * of BluetoothServiceUUIDs, a name parameter, and a namePrefix parameter.
     *
     */
    filters?: BluetoothLEScanFilter[] | undefined;
    /**
     *
     * An array of BluetoothServiceUUIDs.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService/uuid
     *
     */
    optionalServices?: BluetoothServiceUUID[] | undefined;
}

export interface UseBluetoothOptions extends UseBluetoothRequestDeviceOptions, ConfigurableNavigator {
    /**
     *
     * A boolean value indicating that the requesting script can accept all Bluetooth
     * devices. The default is false.
     *
     * !! This may result in a bunch of unrelated devices being shown
     * in the chooser and energy being wasted as there are no filters.
     *
     *
     * Use it with caution.
     *
     * @default false
     *
     */
    acceptAllDevices?: boolean;
}

export function useBluetooth(options?: UseBluetoothOptions): UseBluetoothReturn {
    let { acceptAllDevices = false } = options || {};

    const { filters = undefined, optionalServices = undefined, navigator = defaultNavigator } = options || {};
    const isSupported = useSupported(() => navigator && 'bluetooth' in navigator);
    const device = shallowRef<undefined | BluetoothDevice>(undefined);
    const server = shallowRef<BluetoothRemoteGATTServer | undefined>(undefined);
    const error = shallowRef<unknown | null>(null);
    const isConnected = ref<boolean>(false);

    async function requestDevice(): Promise<void> {
        // This is the function can only be called if Bluetooth API is supported:
        if (!isSupported.value) return;
        error.value = null;
        isConnected.value = false;

        // If filters specified, we need to ensure we  don't accept all devices:
        if (filters && filters.length > 0) acceptAllDevices = false;

        try {
            device.value = await navigator?.bluetooth.requestDevice({
                acceptAllDevices,
                filters,
                optionalServices,
            });

            device.value?.addEventListener('gattserverdisconnected', () => {
                isConnected.value = false;
            });

            server.value = await device.value!.gatt?.connect();
            isConnected.value = true;
        } catch (err) {
            error.value = err;
        }
    }

    return {
        isSupported,
        isConnected,
        // Device:
        device,
        server,
        requestDevice,
        // Errors:
        error,
    };
}

export interface UseBluetoothReturn {
    isSupported: Ref<boolean>;
    isConnected: Ref<boolean>;
    server: Ref<BluetoothRemoteGATTServer | undefined>;
    device: Ref<BluetoothDevice | undefined>;
    requestDevice: () => Promise<void>;
    error: Ref<unknown | null>;
}
