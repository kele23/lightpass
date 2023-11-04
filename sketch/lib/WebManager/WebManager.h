#include "WiFi.h"
#include "ESPAsyncWebServer.h"
#include <AsyncElegantOTA.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include "SPIFFS.h"
#include <ESPmDNS.h>

struct Config
{
    String ssid;
    String password;
};

class WebManager
{
public:
    void setup(String defaultSSID, String defaultPasswd);

private:
    AsyncWebServer *server;
    boolean connectWifi(String ssid, String password);
    void createAP(String ssid, String password);
    Config loadConfig();
    void restart();

    // handlers
    void handleConfigRequest(AsyncWebServerRequest *request);
    void handleResetRequest(AsyncWebServerRequest *request);
    void handleScanRequest(AsyncWebServerRequest *request);
};