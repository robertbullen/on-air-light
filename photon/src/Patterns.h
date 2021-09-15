#if !defined(DISPLAY_MODE_H)
#define DISPLAY_MODE_H

#include <InternetButton.h>
#include "Color.h"
#include "Easing.h"
#include "Timeline.h"

constexpr uint64_t PERIOD_MILLIS = 2000;
constexpr uint8_t RING_LED_COUNT = 11;

class Pattern
{
public:
    Pattern(String name, InternetButton &device, Color &color, Timeline &timeline)
        : _name(name), _color(color), _device(device), _timeline(timeline)
    {
    }

    String name() const
    {
        return this->_name;
    }

    virtual void start()
    {
        this->_device.allLedsOff();
        this->_device.setBrightness(255);
    }

    virtual void update() = 0;

protected:
    String _name;
    Color &_color;
    InternetButton &_device;
    Timeline &_timeline;
};

class SolidPattern : public Pattern
{
public:
    SolidPattern(InternetButton &device, Color &color, Timeline &timeline)
        : Pattern("solid", device, color, timeline)
    {
    }

    void update() override
    {
        this->_device.allLedsOn(this->_color.red(), this->_color.green(), this->_color.blue());
    }
};

class BlinkPattern : public Pattern
{
public:
    BlinkPattern(InternetButton &device, Color &color, Timeline &timeline)
        : Pattern("blink", device, color, timeline)
    {
    }

    void update() override
    {
        if (easeBinary(this->_timeline.progress()) == 1.0)
        {
            this->_device.allLedsOn(this->_color.red(), this->_color.green(), this->_color.blue());
        }
        else
        {
            this->_device.allLedsOff();
        }
    }
};

class FlashPattern : public Pattern
{
public:
    FlashPattern(InternetButton &device, Color &color, Timeline &timeline)
        : Pattern("flash", device, color, timeline)
    {
    }

    void update() override
    {
        uint8_t brightness = round(255 * easeQuad(this->_timeline.progress()));
        this->_device.setBrightness(brightness);
        this->_device.allLedsOn(this->_color.red(), this->_color.green(), this->_color.blue());
    }
};

class PulsePattern : public Pattern
{
public:
    PulsePattern(InternetButton &device, Color &color, Timeline &timeline)
        : Pattern("pulse", device, color, timeline)
    {
    }

    void update() override
    {
        uint8_t brightness = round(255 * easeSine(this->_timeline.progress()));
        this->_device.setBrightness(brightness);
        this->_device.allLedsOn(this->_color.red(), this->_color.green(), this->_color.blue());
    }
};

class SpinPattern : public Pattern
{
public:
    SpinPattern(InternetButton &device, Color &color, Timeline &timeline)
        : Pattern("spin", device, color, timeline)
    {
    }

    void update() override
    {
        uint8_t tailLedIndex = round(RING_LED_COUNT * this->_timeline.progress());
        uint8_t arcLedCount = round(RING_LED_COUNT * 2 / 3.0);
        uint8_t headLedIndex = tailLedIndex + arcLedCount;

        // A shorter algorithm would be to turn all LEDs off first and then only turn on those that
        // require it. That results in flicker, however, so this algorithm is used instead.
        for (uint8_t ledIndex = tailLedIndex; ledIndex < tailLedIndex + RING_LED_COUNT; ledIndex++)
        {
            uint8_t ledNumber = ledIndex % RING_LED_COUNT + 1;
            if (ledIndex >= tailLedIndex && ledIndex < headLedIndex)
            {
                this->_device.ledOn(ledNumber, this->_color.red(), this->_color.green(), this->_color.blue());
            }
            else
            {
                this->_device.ledOff(ledNumber);
            }
        }
    }
};

class AlternatePattern : public Pattern
{
public:
    AlternatePattern(InternetButton &device, Color &color, Timeline &timeline)
        : Pattern("alternate", device, color, timeline)
    {
    }

    void update() override
    {
        for (uint8_t ledIndex = 0; ledIndex < RING_LED_COUNT; ledIndex++)
        {
            uint8_t ledNumber = ledIndex + 1;
            if (ledIndex % 2 == easeBinary(this->_timeline.progress()))
            {
                this->_device.ledOn(ledNumber, this->_color.red(), this->_color.green(), this->_color.blue());
            }
            else
            {
                this->_device.ledOff(ledNumber);
            }
        }
    }
};

#endif // DISPLAY_MODE_H
