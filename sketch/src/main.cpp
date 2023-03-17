#include <Arduino.h>
#include "WiFi.h"
#include "ESPAsyncWebServer.h"
#include "SPIFFS.h"
#include <AsyncElegantOTA.h>
#include <ESPmDNS.h>

const char *ssid = "LightpassV2-TMP";
const char *password = "anatra12";

struct Inter
{
    const uint8_t PIN;
    bool rised;
    unsigned long time;
};

Inter inter = {34, false, millis()};

// server
AsyncWebServer server(80);
AsyncEventSource events("/events");

/**
 * Configure the server
 */
void configureServer()
{

    AsyncElegantOTA.begin(&server); // Start ElegantOTA

    // Route to files
    AsyncStaticWebHandler *handler = &server.serveStatic("/", SPIFFS, "/");
    handler->setDefaultFile("index.html");
    handler->setCacheControl("max-age=86400");
}

/**
 * Configure server events
 */
void configureEvents()
{
    events.onConnect([](AsyncEventSourceClient *client)
                     { 
                    char mystr[40];
                    sprintf(mystr,"%lu", millis());
                    client->send(mystr, "init-event", millis(), 1000); });

    server.addHandler(&events);
}

/**
 * Interrupt service routine
 */
void IRAM_ATTR isr()
{
    unsigned long current = millis();
    if (current - inter.time > 300)
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

    // begin input
    pinMode(inter.PIN, INPUT_PULLUP);
    attachInterrupt(inter.PIN, isr, RISING);

    // begin data storage
    if (!SPIFFS.begin(true))
    {
        return;
    }

    // start wifi
    WiFi.softAP(ssid, password);

    // lightpass mDNS
    if (!MDNS.begin("lightpass"))
    {
        return;
    }

    // print ip
    Serial.println(WiFi.softAPIP());

    // Start server
    configureServer();
    configureEvents();
    server.begin();
}

void loop()
{

    if (inter.rised)
    {
        Serial.printf("Rised at %lu\n", inter.time);

        char mystr[40];
        sprintf(mystr, "%lu", inter.time);
        events.send(mystr, "take-event", millis());

        inter.rised = false;
    }
}