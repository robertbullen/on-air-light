#include <algorithm>
#include <vector>
#include <InternetButton.h>

#include "Color.h"
#include "DisplayMode.h"

InternetButton device;
Color color(0, 0, 0);

SolidDisplayMode solid(device, color);
BlinkDisplayMode blink(device, color);
FlashDisplayMode flash(device, color);
PulseDisplayMode pulse(device, color);
SpinDisplayMode spin(device, color);
AlternateDisplayMode alternate(device, color);

std::vector<DisplayMode *> displayModes{&solid, &blink, &flash, &pulse, &spin, &alternate};
auto displayMode = begin(displayModes);

int setColorHex(String hex)
{
	boolean success = color.fromHex(hex);

	return success ? 1 : -1;
}

int setDisplayMode(String name)
{
	auto foundDisplayMode = std::find_if(begin(displayModes), end(displayModes),
										 [name](DisplayMode *item)
										 { return item->name.equals(name); });
	if (foundDisplayMode == end(displayModes))
	{
		return -1;
	}
	if (foundDisplayMode == displayMode)
	{
		return 0;
	}

	displayMode = foundDisplayMode;
	(*displayMode)->start();

	return 1;
}

void setup()
{
	Particle.function("setColorHex", setColorHex);
	Particle.function("setDisplayMode", setDisplayMode);

	device.begin();
	(*displayMode)->start();
}

void loop()
{
	(*displayMode)->update();
}
