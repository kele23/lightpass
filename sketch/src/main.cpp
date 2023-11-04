#include <Arduino.h>
#include <WebManager.h>
#include <BleManager.h>

#define PIN 16

BleManager bleManager;
WebManager webManager;

///// INTERRUPT
struct Inter
{
    bool rised;
    unsigned long time;
};

Inter inter;

void IRAM_ATTR isr()
{
    unsigned long current = millis();
    if (!inter.rised && (current - inter.time) > 300)
    {
        inter.time = current;
        inter.rised = true;
    }
}

///////////////////////////////////
///////////////////////////////////
//////////////////////////////////
///////////////////////////////////
void setup()
{
    Serial.begin(115200);
    Serial.println(
"  _      _____ _____ _    _ _______ _____         _____ _____ \n"
" | |    |_   _/ ____| |  | |__   __|  __ \\ /\\    / ____/ ____|\n"
" | |      | || |  __| |__| |  | |  | |__) /  \\  | (___| (___  \n"
" | |      | || | |_ |  __  |  | |  |  ___/ /\\ \\  \\___ \\___ \\ \n"
" | |____ _| || |__| | |  | |  | |  | |  / ____ \\ ____) |___) |\n"
" |______|_____\\_____|_|  |_|  |_|  |_| /_/    \\_\\_____/_____/ \n");

    // begin data storage
    if (!SPIFFS.begin(true))
    {
        return;
    }

    uint32_t chipId = 0;
    for (int i = 0; i < 17; i = i + 8)
    {
        chipId |= ((ESP.getEfuseMac() >> (40 - i)) & 0xff) << i;
    }

    String chipIdStr = String(chipId, HEX);
    chipIdStr.toUpperCase();

    // input
    inter = Inter({false, millis()});
    pinMode(PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN), isr, FALLING);

    // bluetooth
    bleManager.setup("Lightpass ESP32 (" + chipIdStr + ")");

    // web - wifi
    webManager.setup("Lightpass ESP32 (" + chipIdStr + ")", String("anatra12"));

    Serial.println("PG - Started");
}

void loop()
{

    if (inter.rised)
    {
        bleManager.addTime(inter.time);
        Serial.printf("PG - New time %lu\n", inter.time);
        inter.rised = false;
    }
}
