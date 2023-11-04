#include <Arduino.h>
#include "NimBLEDevice.h"

///// BLUETOOTH
#define LIGHTPASS_SERVICE "b5b0c9c5-36b4-474e-8922-1a4676c70002"
#define NOTIFY_TAKE_CHARACTERISTIC "5714ff7d-43d5-49f1-8f57-5c0ecbcfd459"
#define TIMES_CHARACTERISTIC "e0ec91ab-e8bb-4779-a1a0-6582ec9d977e"

class BleManager : public BLEServerCallbacks
{
public:
    void setup(String name);
    void addTime(unsigned long time);
    void onConnect(BLEServer *pServer);
    void onDisconnect(BLEServer *pServer);

private:
    BLEServer *pServer;
    BLEService *pService;
    BLECharacteristic *notifyCharacteristic;
    BLECharacteristic *timesCharacteristic;
    bool deviceConnected = false;
    unsigned long times[100];
    int timesSize = 0;
};