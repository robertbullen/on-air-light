#if !defined(COLOR_H)
#define COLOR_H

#include <cstdlib>

class Color
{
public:
    Color(uint8_t red = 0, uint8_t green = 0, uint8_t blue = 0)
        : blue(blue), green(green), red(red)
    {
    }

    boolean fromHex(String hex)
    {
        String zero("00");

        uint8_t colors[3];
        for (size_t i = 0; i < sizeof(colors) / sizeof(colors[0]); i++)
        {
            auto byteText = hex.substring(i * 2, i * 2 + 2);
            colors[i] = strtol(byteText, nullptr, 16);
            if (colors[i] == 0 && !byteText.equals(zero))
            {
                return false;
            }
        }

        this->red = colors[0];
        this->green = colors[1];
        this->blue = colors[2];

        return true;
    }

    uint8_t blue;
    uint8_t green;
    uint8_t red;
};

#endif // COLOR_H
