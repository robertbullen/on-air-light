#if !defined(COLOR_H)
#define COLOR_H

#include <cstdlib>

class Color
{
public:
    Color(String hex = "000000")
        : _hex("000000"), _red(0), _green(0), _blue(0)
    {
        this->setHex(hex);
    }

    String getHex() const
    {
        return this->_hex;
    }

    boolean setHex(String hex)
    {
        if (hex.length() != 6)
        {
            return false;
        }

        static String zero("00");

        uint8_t colors[3];
        for (size_t i = 0; i < sizeof(colors) / sizeof(colors[0]); i++)
        {
            String byteText = hex.substring(i * 2, i * 2 + 2);
            colors[i] = strtol(byteText, nullptr, 16);
            if (colors[i] == 0 && !byteText.equals(zero))
            {
                return false;
            }
        }

        this->_hex = hex;
        this->_red = colors[0];
        this->_green = colors[1];
        this->_blue = colors[2];

        return true;
    }

    uint8_t blue() const
    {
        return this->_blue;
    }

    uint8_t green() const
    {
        return this->_green;
    }

    uint8_t red() const
    {
        return this->_red;
    }

private:
    String _hex;
    uint8_t _red;
    uint8_t _green;
    uint8_t _blue;
};

#endif // COLOR_H
