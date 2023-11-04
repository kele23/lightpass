
#include "WebManager.h"

void WebManager::setup(String defaultSSID, String defaultPasswd)
{
    Config config = loadConfig();

    if (!connectWifi(config.ssid, config.password))
        createAP(defaultSSID, defaultPasswd);

    // mDNS
    if (!MDNS.begin("lightpass"))
    {
        Serial.println("PG - Error setting up MDNS responder!");
    }

    server = new AsyncWebServer(80);

    // Start ElegantOTA
    AsyncElegantOTA.begin(server);

    server->on("/config/set-wifi", HTTP_POST, [this](AsyncWebServerRequest *request)
               { this->handleConfigRequest(request); });
    server->on("/config/reset-to-ap", HTTP_POST, [this](AsyncWebServerRequest *request)
               { this->handleResetRequest(request); });

    // serve statics
    AsyncStaticWebHandler *handler = &(server->serveStatic("/", SPIFFS, "/"));
    handler->setDefaultFile("index.html");
    handler->setCacheControl("max-age=86400");

    server->begin();
}

boolean WebManager::connectWifi(String ssid, String password)
{
    if (ssid == "" || password == "")
    {
        return false;
    }

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), password.c_str());

    Serial.println("WM - connectWifi - Connecting to WiFi...");

    unsigned long currentMillis = millis();
    unsigned long previousMillis = currentMillis;
    while (WiFi.status() != WL_CONNECTED)
    {
        currentMillis = millis();
        if (currentMillis - previousMillis >= 10000)
        {
            Serial.println("WM - connectWifi - Failed to connect. Timeout!");
            return false;
        }
        delay(100); // min delay
    }

    Serial.println("WM - connectWifi - " + WiFi.localIP().toString());
    return true;
}

void WebManager::createAP(String ssid, String password)
{
    WiFi.softAP(ssid.c_str(), password.c_str());
    Serial.println("WM - createAP - Created Access point " + ssid);
}

Config WebManager::loadConfig()
{
    fs::File file = SPIFFS.open("/config.json", "r");
    if (!file)
    {
        return Config({ssid : "", password : ""});
    }

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, file);
    if (error)
    {
        Serial.printf("WM - loadConfig - Cannot read config file due to JSON error\n");
        return Config({ssid : "", password : ""});
    }

    JsonObject obj = doc.as<JsonObject>();
    Config config = {};

    config.ssid = obj["ssid"].as<String>();
    config.password = obj["password"].as<String>();

    // Close the file (Curiously, File's destructor doesn't close the file)
    file.close();
    return config;
}

void WebManager::handleConfigRequest(AsyncWebServerRequest *request)
{

    fs::File file = SPIFFS.open("/config.json", "w");
    if (!file)
    {
        request->send(500, "application/json", "{ \"ok\": false, \"message\": \"Cannot open file\"}");
        Serial.println("WC - handleConfigRequest - Error during open config file for writing");
        return;
    }

    String ssid = request->getParam("ssid", true)->value();
    String password = request->getParam("password", true)->value();

    String json = "{";
    json += "\"ssid\":\"" + ssid + "\"";
    json += ",\"password\":\"" + password + "\"";
    json += "}";

    int bytesWritten = file.print(json);
    file.close();

    if (bytesWritten <= 0)
    {
        request->send(500, "application/json", "{ \"ok\": false, \"message\": \"Cannot write file\"}");
        Serial.println("WC - handleConfigRequest - Error during writing config file");
        return;
    }

    request->send(200, "application/json", "{ \"ok\": true, \"message\": \"ESP will be restarted\" }");
    Serial.println("WC - handleConfigRequest - Changed config correctly");
    this->restart();
}

void WebManager::handleResetRequest(AsyncWebServerRequest *request)
{
    boolean ok = SPIFFS.remove("/config.json");
    if (!ok)
    {
        request->send(500, "application/json", "{ \"ok\": false, \"message\": \"Cannot delete file\"}");
        Serial.println("WC - handleConfigRequest - Error during delete config file");
        return;
    }

    request->send(200, "application/json", "{ \"ok\": true, \"message\": \"ESP will be restarted\" }");
    Serial.println("WC - handleConfigRequest - Changed config correctly");
    this->restart();
}

void WebManager::handleScanRequest(AsyncWebServerRequest *request)
{

    String json = "[";
    int n = WiFi.scanComplete();
    if (n == -2)
    {
        WiFi.scanNetworks(true);
    }
    else if (n)
    {
        for (int i = 0; i < n; ++i)
        {
            if (i)
                json += ",";
            json += "{";
            json += "\"rssi\":" + String(WiFi.RSSI(i));
            json += ",\"ssid\":\"" + WiFi.SSID(i) + "\"";
            json += ",\"bssid\":\"" + WiFi.BSSIDstr(i) + "\"";
            json += ",\"channel\":" + String(WiFi.channel(i));
            json += ",\"secure\":" + String(WiFi.encryptionType(i));
            json += "}";
        }
        WiFi.scanDelete();
        if (WiFi.scanComplete() == -2)
        {
            WiFi.scanNetworks(true);
        }
    }
    json += "]";
    request->send(200, "application/json", json);
    json = String();
}

void WebManager::restart()
{
    yield();
    delay(1000);
    yield();
    ESP.restart();
}