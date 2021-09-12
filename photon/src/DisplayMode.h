#if !defined(DISPLAY_MODE_H)
#define DISPLAY_MODE_H

#include <InternetButton.h>
#include "Color.h"
#include "Easing.h"
#include "Period.h"

constexpr uint64_t PERIOD_MILLIS = 2000;
constexpr uint8_t RING_LED_COUNT = 11;

class DisplayMode
{
public:
    DisplayMode(String name, InternetButton &device, Color &color)
        : name(name), color(color), device(device)
    {
    }

    virtual void start()
    {
        this->device.allLedsOff();
        this->device.setBrightness(255);
    }

    virtual void update() = 0;

    String name;

protected:
    Color &color;
    InternetButton &device;
};

class SolidDisplayMode : public DisplayMode
{
public:
    SolidDisplayMode(InternetButton &device, Color &color)
        : DisplayMode("solid", device, color)
    {
    }

    void update() override
    {
        this->device.allLedsOn(this->color.red, this->color.green, this->color.blue);
    }
};

class BlinkDisplayMode : public DisplayMode
{
public:
    BlinkDisplayMode(InternetButton &device, Color &color, uint64_t periodMillis = PERIOD_MILLIS)
        : DisplayMode("blink", device, color), periodMillis(periodMillis)
    {
    }

    void update() override
    {
        Period period(this->periodMillis);
        if (easeBinary(period.progressPercent) == 1.0)
        {
            this->device.allLedsOn(this->color.red, this->color.green, this->color.blue);
        }
        else
        {
            this->device.allLedsOff();
        }
    }

private:
    uint64_t periodMillis;
};

class FlashDisplayMode : public DisplayMode
{
public:
    FlashDisplayMode(InternetButton &device, Color &color, uint64_t periodMillis = PERIOD_MILLIS)
        : DisplayMode("flash", device, color), periodMillis(periodMillis)
    {
    }

    void update() override
    {
        Period period(this->periodMillis);
        uint8_t brightness = round(255 * easeQuint(period.progressPercent));
        this->device.setBrightness(brightness);
        this->device.allLedsOn(this->color.red, this->color.green, this->color.blue);
    }

private:
    uint64_t periodMillis;
};

class PulseDisplayMode : public DisplayMode
{
public:
    PulseDisplayMode(InternetButton &device, Color &color, uint64_t periodMillis = PERIOD_MILLIS)
        : DisplayMode("pulse", device, color), periodMillis(periodMillis)
    {
    }

    void update() override
    {
        Period period(this->periodMillis);
        uint8_t brightness = round(255 * easeSine(period.progressPercent));
        this->device.setBrightness(brightness);
        this->device.allLedsOn(this->color.red, this->color.green, this->color.blue);
    }

private:
    uint64_t periodMillis;
};

class SpinDisplayMode : public DisplayMode
{
public:
    SpinDisplayMode(InternetButton &device, Color &color, uint64_t periodMillis = PERIOD_MILLIS)
        : DisplayMode("spin", device, color), periodMillis(periodMillis)
    {
    }

    void update() override
    {
        Period period(this->periodMillis);

        uint8_t tailLedIndex = round(RING_LED_COUNT * period.progressPercent);
        uint8_t arcLedCount = round(RING_LED_COUNT * 2 / 3.0);
        uint8_t headLedIndex = tailLedIndex + arcLedCount;

        // A shorter algorithm would be to turn all LEDs off first and then only turn on those that
        // require it. That results in flicker, however, so this algorithm is used instead.
        for (uint8_t ledIndex = tailLedIndex; ledIndex < tailLedIndex + RING_LED_COUNT; ledIndex++)
        {
            uint8_t ledNumber = ledIndex % RING_LED_COUNT + 1;
            if (ledIndex >= tailLedIndex && ledIndex < headLedIndex)
            {
                this->device.ledOn(ledNumber, this->color.red, this->color.green, this->color.blue);
            }
            else
            {
                this->device.ledOff(ledNumber);
            }
        }
    }

private:
    uint64_t periodMillis;
};

class AlternateDisplayMode : public DisplayMode
{
public:
    AlternateDisplayMode(InternetButton &device, Color &color, uint64_t periodMillis = PERIOD_MILLIS)
        : DisplayMode("alternate", device, color), periodMillis(periodMillis)
    {
    }

    void update() override
    {
        Period period(this->periodMillis);
        for (uint8_t ledIndex = 0; ledIndex < RING_LED_COUNT; ledIndex++)
        {
            uint8_t ledNumber = ledIndex + 1;
            if (ledIndex % 2 == easeBinary(period.progressPercent))
            {
                this->device.ledOn(ledNumber, this->color.red, this->color.green, this->color.blue);
            }
            else
            {
                this->device.ledOff(ledNumber);
            }
        }
    }

private:
    uint64_t periodMillis;
};

#endif // DISPLAY_MODE_H
