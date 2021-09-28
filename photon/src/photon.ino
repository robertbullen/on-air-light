#include <algorithm>
#include <vector>
#include <InternetButton.h>

#include "Color.h"
#include "Patterns.h"
#include "Timeline.h"

InternetButton device;

// Colors

Color color;

std::vector<std::pair<String, String>> namedColors = {
	{"black", "000000"},
	{"white", "ffffff"},
	{"red", "ff0000"},
	{"yellow", "ffff00"},
	{"lime", "00ff00"},
	{"cyan", "00ffff"},
	{"blue", "0000ff"},
	{"magenta", "ff00ff"},
};

String getColor()
{
	return color.getHex();
}

int setColor(String nameOrHex)
{
	std::vector<std::pair<String, String>>::const_iterator foundColor = std::find_if(
		std::begin(namedColors),
		std::end(namedColors),
		[nameOrHex](std::pair<String, String> &entry)
		{
			return entry.first == nameOrHex;
		});
	String hex = foundColor != std::end(namedColors) ? foundColor->second : nameOrHex;
	if (hex == color.getHex())
	{
		return 0;
	}
	boolean success = color.setHex(hex);
	return success ? 1 : -1;
}

void nextColor()
{
	std::vector<std::pair<String, String>>::const_iterator foundColor = std::find_if(
		std::begin(namedColors),
		std::end(namedColors),
		[](std::pair<String, String> &entry)
		{
			return entry.second == color.getHex();
		});
	if (foundColor != std::end(namedColors))
	{
		foundColor++;
	}
	if (foundColor == std::end(namedColors))
	{
		foundColor = std::begin(namedColors);
	}
	String hex = foundColor->second;
	color.setHex(hex);
}

// Timeline

std::vector<uint64_t> durations{1000, 2000, 3000, 4000, 5000};

Timeline timeline;

int getDuration()
{
	return timeline.getDuration();
}

int setDuration(String duration)
{
	uint64_t oldDuration = timeline.getDuration();
	uint64_t newDuration = duration.toInt();
	if (newDuration == oldDuration)
	{
		return 0;
	}
	boolean success = timeline.setDuration(newDuration);
	return success ? 1 : -1;
}

void nextDuration()
{
	std::vector<uint64_t>::const_iterator foundDuration = std::find(
		std::begin(durations),
		std::end(durations),
		timeline.getDuration());
	if (foundDuration != std::end(durations))
	{
		foundDuration++;
	}
	if (foundDuration == std::end(durations))
	{
		foundDuration = std::begin(durations);
	}
	timeline.setDuration(*foundDuration);
}

// Patterns

std::vector<Pattern *> patterns{
	new SolidPattern(device, color, timeline),
	new BlinkPattern(device, color, timeline),
	new PulsePattern(device, color, timeline),
	new FlashPattern(device, color, timeline),
	new SpinPattern(device, color, timeline),
	new AlternatePattern(device, color, timeline),
};
std::vector<Pattern *>::const_iterator pattern = std::begin(patterns);

String getPattern()
{
	return (*pattern)->name();
}

int setPattern(String newName)
{
	std::vector<Pattern *>::const_iterator foundPattern = std::find_if(
		std::begin(patterns),
		std::end(patterns),
		[newName](Pattern *item)
		{ return item->name().equals(newName); });
	if (foundPattern == pattern)
	{
		return 0;
	}
	if (foundPattern == std::end(patterns))
	{
		return -1;
	}
	pattern = foundPattern;
	(*pattern)->start();
	return 1;
}

void nextPattern()
{
	pattern++;
	if (pattern == std::end(patterns))
	{
		pattern = std::begin(patterns);
	}
	(*pattern)->start();
}

class ButtonPressDetector
{
public:
	explicit ButtonPressDetector(uint8_t buttonNumber)
		: _buttonNumber(buttonNumber), _wasDown(false)
	{
	}

	boolean wasPressed()
	{
		boolean isDown = device.buttonOn(this->_buttonNumber);
		boolean result = this->_wasDown && !isDown;
		this->_wasDown = isDown;
		return result;
	}

private:
	uint8_t _buttonNumber;
	boolean _wasDown;
};

ButtonPressDetector button1 = ButtonPressDetector(1);
ButtonPressDetector button2 = ButtonPressDetector(2);
ButtonPressDetector button3 = ButtonPressDetector(3);

void setup()
{
	Particle.variable("color", getColor);
	Particle.function("setColor", setColor);

	Particle.variable("duration", getDuration);
	Particle.function("setDuration", setDuration);

	Particle.variable("pattern", getPattern);
	Particle.function("setPattern", setPattern);

	device.begin();

	timeline.update();
	(*pattern)->start();
}

void loop()
{
	if (button1.wasPressed())
	{
		nextPattern();
	}
	if (button2.wasPressed())
	{
		nextColor();
	}
	if (button3.wasPressed())
	{
		nextDuration();
	}

	timeline.update();
	(*pattern)->update();
}
