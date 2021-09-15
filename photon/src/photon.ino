#include <algorithm>
#include <vector>
#include <InternetButton.h>

#include "Color.h"
#include "Patterns.h"
#include "Timeline.h"

InternetButton device;
Color color;
Timeline timeline;

SolidPattern solid(device, color, timeline);
BlinkPattern blink(device, color, timeline);
FlashPattern flash(device, color, timeline);
PulsePattern pulse(device, color, timeline);
SpinPattern spin(device, color, timeline);
AlternatePattern alternate(device, color, timeline);

std::vector<Pattern *> patterns{&solid, &blink, &flash, &pulse, &spin, &alternate};
auto pattern = begin(patterns);

String getColor()
{
	return color.getHex();
}

int setColor(String newHex)
{
	String oldHex = color.getHex();
	if (newHex.equals(oldHex))
	{
		return 0;
	}

	boolean success = color.setHex(newHex);

	return success ? 1 : -1;
}

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

String getPattern()
{
	return (*pattern)->name();
}

int setPattern(String newName)
{
	String oldName = (*pattern)->name();

	if (newName.equals(oldName))
	{
		return 0;
	}

	auto foundPattern = std::find_if(begin(patterns), end(patterns),
									 [newName](Pattern *item)
									 { return item->name().equals(newName); });
	if (foundPattern == end(patterns))
	{
		return -1;
	}

	pattern = foundPattern;
	(*pattern)->start();

	return 1;
}

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
	timeline.update();
	(*pattern)->update();
}
