#include "BleManager.h"

void BleManager::setup(String name)
{

    // bluetooth
    BLEDevice::init(name.c_str());
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(this);

    pService = pServer->createService(LIGHTPASS_SERVICE);
    notifyCharacteristic = pService->createCharacteristic(NOTIFY_TAKE_CHARACTERISTIC, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
    timesCharacteristic = pService->createCharacteristic(TIMES_CHARACTERISTIC, NIMBLE_PROPERTY::READ);
    timesCharacteristic->setValue((uint8_t *)times, 4 * 100);
    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(LIGHTPASS_SERVICE);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println("BM - setup - Started advertising");
}

void BleManager::addTime(unsigned long time)
{

    // set value of time
    notifyCharacteristic->setValue((uint8_t *)&time, 4);
    if (deviceConnected)
    {
        notifyCharacteristic->notify(); // notify to connected devices
        delay(3);                       // minimum bluetooth wait
    }

    // add time to times array
    if (timesSize > 0)
    {
        // shift right
        for (int i = timesSize - 1; i >= 0; i--)
            if (i < 99)
                times[i + 1] = times[i];
    }

    times[0] = time;
    if (timesSize < 100)
        timesSize++;
}

void BleManager::onConnect(BLEServer *pServer)
{
    deviceConnected = true;
    Serial.println("BM - onConnect - Connected client");
};

void BleManager::onDisconnect(BLEServer *pServer)
{
    deviceConnected = false;
    pServer->getAdvertising()->start();
    Serial.println("BM - onDisconnect - Disconnected client");
}